import { authSession } from '../auth/authSession';
import { ApiError, type ApiErrorBody } from '../types/api';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = (
  typeof rawBaseUrl === 'string' && rawBaseUrl.trim() !== ''
    ? rawBaseUrl.trim()
    : 'http://localhost:8084'
).replace(/\/+$/, '');

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export function triggerUnauthorized(): void {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipUnauthorizedHandler?: boolean;
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | undefined> {
  try {
    const data = await response.json();
    if (data && typeof data === 'object') {
      return data as ApiErrorBody;
    }
    if (typeof data === 'string' && data.trim() !== '') {
      return { message: data };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function formatErrorMessage(response: Response, errorBody?: ApiErrorBody): string {
  if (errorBody?.message && typeof errorBody.message === 'string' && errorBody.message.trim() !== '') {
    return errorBody.message;
  }
  if (errorBody?.error && typeof errorBody.error === 'string' && errorBody.error.trim() !== '') {
    return errorBody.error;
  }
  if (response.status === 503) {
    if (errorBody?.service && typeof errorBody.service === 'string' && errorBody.service.trim() !== '') {
      return `${errorBody.service} is temporarily unavailable`;
    }
    return 'Service is temporarily unavailable (503)';
  }
  return response.statusText || `Request failed with status ${response.status}`;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipUnauthorizedHandler, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  requestHeaders.set('Accept', 'application/json');

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const token = authSession.getToken();
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await parseErrorBody(response);

    if (
      response.status === 401 &&
      !skipUnauthorizedHandler &&
      unauthorizedHandler
    ) {
      if (token && authSession.getToken() === token) {
        unauthorizedHandler();
      }
    }

    const message = formatErrorMessage(response, errorBody);

    throw new ApiError(response.status, message, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

