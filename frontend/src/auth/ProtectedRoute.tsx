import { Navigate, Outlet } from 'react-router-dom';

import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, serviceError, retryBootstrap, logout } =
    useAuth();

  if (isLoading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  if (serviceError) {
    return (
      <div className="loading-screen" role="alert">
        <div
          className="alert alert--error"
          style={{ maxWidth: '440px', textAlign: 'center' }}
        >
          <strong
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1rem',
            }}
          >
            Service Temporarily Unavailable
          </strong>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>
            {serviceError}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => void retryBootstrap()}
            >
              Retry Connection
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

