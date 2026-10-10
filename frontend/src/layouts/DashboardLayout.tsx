import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';
import {
  IconAlerts,
  IconDashboard,
  IconLogout,
  IconMissions,
  IconNotifications,
  IconTelemetry,
  IconUser,
  IconVehicles,
} from '../components/Icons';
import { useNotification } from '../context/NotificationContext';
import type { UserRole } from '../types/auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/vehicles', label: 'Vehicles', icon: IconVehicles },
  { to: '/missions', label: 'Missions', icon: IconMissions },
  { to: '/telemetry', label: 'Telemetry', icon: IconTelemetry },
  { to: '/alerts', label: 'Alerts', icon: IconAlerts },
  { to: '/notifications', label: 'Notifications', icon: IconNotifications },
];

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Operational Overview';
  if (pathname.startsWith('/vehicles')) return 'Fleet Registry';
  if (pathname.startsWith('/missions')) return 'Mission Operations';
  if (pathname.startsWith('/telemetry')) return 'Live Telemetry';
  if (pathname.startsWith('/alerts')) return 'Incident & Alerts Log';
  if (pathname.startsWith('/notifications')) return 'Notification Feed';
  return 'Mission Control';
}

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'role-tag role-tag--admin';
    case 'OPERATOR':
      return 'role-tag role-tag--operator';
    case 'VIEWER':
      return 'role-tag role-tag--viewer';
  }
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotification();
  const location = useLocation();

  if (!user) {
    return null;
  }

  const currentTitle = getPageTitle(location.pathname);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand__badge">MC</span>
            <span className="sidebar-brand__name">Mission Control</span>
          </div>
          <div className="sidebar-status-indicator" title="System Connected">
            <span className="sidebar-status-dot" />
            <span>ONLINE</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'nav-item nav-item--active' : 'nav-item'
                }
              >
                <div className="nav-item__left">
                  <Icon size={14} />
                  <span>{item.label}</span>
                </div>
                {item.to === '/notifications' && unreadCount > 0 && (
                  <span className="nav-item__badge" aria-label={`${unreadCount} unread`}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="app-header__title">
            <span className="header-tag">SYS // GATEWAY :8084</span>
            <h1 className="app-header__heading">{currentTitle}</h1>
          </div>

          <div className="app-header__right">
            <div className="operator-info">
              <IconUser size={13} style={{ color: 'var(--text-secondary)' }} />
              <span className="operator-name">{user.name}</span>
              <span className={roleBadgeClass(user.role)}>{user.role}</span>
            </div>

            <button
              type="button"
              className="btn btn--ghost btn--xs"
              onClick={logout}
              title="Sign out of console"
            >
              <IconLogout size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="content-pane">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
