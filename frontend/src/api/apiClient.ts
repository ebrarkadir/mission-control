import { authSession } from '../auth/authSession';
import { ApiError, type ApiErrorBody } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipUnauthorizedHandler?: boolean;
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | undefined> {
  try {
    return (await response.json()) as ApiErrorBody;
  } catch {
    return undefined;
  }
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
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
      unauthorizedHandler();
    }

    throw new ApiError(
      response.status,
      errorBody?.message ?? response.statusText,
      errorBody,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
