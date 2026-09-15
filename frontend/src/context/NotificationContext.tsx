import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { notificationApi } from '../api/notificationApi';
import { useAuth } from '../auth/AuthContext';

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: () => void;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      // Must not break the layout if unread-count request fails
      console.warn('Failed to load unread notifications count:', err);
    }
  }, [isAuthenticated]);

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        decrementUnreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}
