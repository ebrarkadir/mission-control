import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authApi } from '../api/authApi';
import { setUnauthorizedHandler } from '../api/apiClient';
import { ApiError } from '../types/api';
import type { LoginRequest, User } from '../types/auth';
import { authSession } from './authSession';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  serviceError: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const logout = useCallback(() => {
    authSession.clearToken();
    setUser(null);
    setServiceError(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  const loadSession = useCallback(async (token: string, isMounted: () => boolean) => {
    try {
      const currentUser = await authApi.getCurrentUser();
      if (isMounted() && authSession.getToken() === token) {
        setUser(currentUser);
        setServiceError(null);
      }
    } catch (err) {
      if (!isMounted() || authSession.getToken() !== token) {
        return;
      }

      if (err instanceof ApiError && err.status === 401) {
        // Confirmed authentication failure - invalidate session
        authSession.clearToken();
        setUser(null);
        setServiceError(null);
      } else {
        // 503, network error, or other temporary failure:
        // Do NOT delete the token, keep session stored and record service error
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Service is temporarily unavailable';
        setServiceError(message);
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const token = authSession.getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    void loadSession(token, () => mounted);

    return () => {
      mounted = false;
    };
  }, [loadSession]);

  const retryBootstrap = useCallback(async () => {
    const token = authSession.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setServiceError(null);
    await loadSession(token, () => true);
  }, [loadSession]);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    authSession.setToken(response.accessToken);
    setUser(response.user);
    setServiceError(null);
    setIsLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      serviceError,
      login,
      logout,
      retryBootstrap,
    }),
    [user, isLoading, serviceError, login, logout, retryBootstrap],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

