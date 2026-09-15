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
    return <LoadingScreen message="Checking session..." />;
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
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <span className="login-card__mark">MC</span>
          <h1>Mission Control</h1>
          <p>Sign in to access the operations dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
