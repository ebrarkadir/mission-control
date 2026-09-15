export type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
