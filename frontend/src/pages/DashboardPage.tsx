import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Welcome, {user?.name}</h2>
        <p>
          Mission Control is online. Select a module from the sidebar to begin
          operations.
        </p>
      </div>

      <div className="status-grid">
        <article className="status-card">
          <span className="status-card__label">System Status</span>
          <strong className="status-card__value status-card__value--online">
            Online
          </strong>
        </article>
        <article className="status-card">
          <span className="status-card__label">Active Operator</span>
          <strong className="status-card__value">{user?.name}</strong>
        </article>
        <article className="status-card">
          <span className="status-card__label">Access Level</span>
          <strong className="status-card__value">{user?.role}</strong>
        </article>
        <article className="status-card">
          <span className="status-card__label">Modules Ready</span>
          <strong className="status-card__value">6</strong>
        </article>
      </div>
    </section>
  );
}
