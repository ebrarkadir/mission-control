export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
  errors?: Record<string, string>;
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
}
