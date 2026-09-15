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
import type { LoginRequest, User } from '../types/auth';
import { authSession } from './authSession';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    authSession.clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      const token = authSession.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          authSession.clearToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authApi.login(credentials);
    authSession.setToken(response.accessToken);
    setUser(response.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
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
