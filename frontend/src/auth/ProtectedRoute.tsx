import { Navigate, Outlet } from 'react-router-dom';

import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
