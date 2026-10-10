import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { ApiError } from '../types/api';

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <LoadingScreen message="Verifying operator session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Authorization failed. Verify credentials and gateway connectivity.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-card__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <span className="sidebar-brand__badge">MC</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              SYS // OPS-CONSOLE
            </span>
          </div>
          <h1 className="login-card__title">Mission Control Terminal</h1>
          <p className="login-card__subtitle">
            Enter credentials to access telemetry streams and autonomous fleet operations
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert-banner alert-banner--error" role="alert">
              <span>{error}</span>
            </div>
          )}

          <label className="field">
            <span>Operator Identity</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="operator@missioncontrol.internal"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span>Access Key</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            style={{ marginTop: '0.35rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Authorizing Session...' : 'Authenticate'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <span>GATEWAY :8084</span>
          <span>AUTONOMOUS OPS</span>
        </div>
      </div>
    </div>
  );
}
