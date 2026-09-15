import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import { useNotification } from '../context/NotificationContext';
import type { UserRole } from '../types/auth';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/missions', label: 'Missions' },
  { to: '/telemetry', label: 'Live Telemetry' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/notifications', label: 'Notifications' },
];

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'role-badge role-badge--admin';
    case 'OPERATOR':
      return 'role-badge role-badge--operator';
    case 'VIEWER':
      return 'role-badge role-badge--viewer';
  }
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand__mark">MC</span>
          <div>
            <strong>Mission Control</strong>
            <span>Defense Operations</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
            >
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="nav-badge" aria-label={`${unreadCount} unread`}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header__title">
            <h1>Mission Control Dashboard</h1>
            <p>Operational command center</p>
          </div>

          <div className="dashboard-header__user">
            <div className="user-info">
              <span className="user-info__name">{user.name}</span>
              <span className="user-info__email">{user.email}</span>
            </div>
            <span className={roleBadgeClass(user.role)}>{user.role}</span>
            <button type="button" className="btn btn--ghost" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
