import type { LoginRequest, LoginResponse, User } from '../types/auth';
import { apiClient } from './apiClient';

export const authApi = {
  login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials,
      skipUnauthorizedHandler: true,
    });
  },

  getCurrentUser(): Promise<User> {
    return apiClient<User>('/api/auth/me');
  },
};
