export interface ApiErrorBody {
  status?: number | string;
  error?: string;
  message?: string;
  service?: string;
  path?: string;
  timestamp?: string;
  errors?: Record<string, string>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  get isServiceUnavailable(): boolean {
    return this.status === 503;
  }

  get service(): string | undefined {
    return this.body?.service;
  }
}
