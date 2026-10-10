import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { missionApi } from '../api/missionApi';
import { notificationApi } from '../api/notificationApi';
import { vehicleApi } from '../api/vehicleApi';
import {
  IconAlerts,
  IconClock,
  IconExternalLink,
  IconMissions,
  IconNotifications,
  IconPlus,
  IconRadio,
  IconRefresh,
  IconTelemetry,
  IconVehicles,
} from '../components/Icons';
import { ApiError } from '../types/api';
import type { Mission } from '../types/mission';
import type { NotificationItem } from '../types/notification';
import type { Vehicle } from '../types/vehicle';

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [vRes, mRes, nRes] = await Promise.allSettled([
      vehicleApi.getAll(),
      missionApi.getAll(),
      notificationApi.getAll(),
    ]);

    if (vRes.status === 'fulfilled') {
      setVehicles(vRes.value);
    }
    if (mRes.status === 'fulfilled') {
      setMissions(mRes.value);
    }
    if (nRes.status === 'fulfilled') {
      setNotifications(nRes.value);
    }

    const errors: string[] = [];
    if (vRes.status === 'rejected') {
      errors.push(
        vRes.reason instanceof ApiError ? vRes.reason.message : 'Fleet service unavailable',
      );
    }
    if (mRes.status === 'rejected') {
      errors.push(
        mRes.reason instanceof ApiError ? mRes.reason.message : 'Mission service unavailable',
      );
    }
    if (nRes.status === 'rejected') {
      errors.push(
        nRes.reason instanceof ApiError ? nRes.reason.message : 'Notification service unavailable',
      );
    }

    if (errors.length > 0) {
      setError(errors.join(' | '));
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Derived metrics
  const stats = useMemo(() => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE').length;
    const offlineVehicles = vehicles.filter((v) => v.status === 'OFFLINE').length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === 'MAINTENANCE').length;

    const totalMissions = missions.length;
    const activeMissions = missions.filter((m) => m.status === 'ACTIVE').length;
    const readyMissions = missions.filter((m) => m.status === 'READY').length;
    const plannedMissions = missions.filter((m) => m.status === 'PLANNED').length;
    const completedMissions = missions.filter((m) => m.status === 'COMPLETED').length;

    const unreadNotifications = notifications.filter((n) => !n.read).length;

    return {
      totalVehicles,
      activeVehicles,
      offlineVehicles,
      maintenanceVehicles,
      totalMissions,
      activeMissions,
      readyMissions,
      plannedMissions,
      completedMissions,
      unreadNotifications,
    };
  }, [vehicles, missions, notifications]);

  const activeOrReadyMissions = useMemo(() => {
    return missions
      .filter((m) => m.status === 'ACTIVE' || m.status === 'READY')
      .slice(0, 5);
  }, [missions]);

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  return (
    <div>
      {/* Header */}
      <div className="ops-page-header">
        <div className="ops-page-title">
          <h2>Operational Command Dashboard</h2>
          <p>Real-time autonomous vehicle readiness, mission status, and event feeds</p>
        </div>
        <div className="ops-header-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <IconRefresh size={12} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Degradation error alert if any service fails */}
      {error && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Summary Metrics Row */}
      <div className="ops-stats-row">
        <div className="ops-stat-card">
          <span className="ops-stat-label">
            <span>Fleet Active</span>
            <IconVehicles size={13} style={{ color: 'var(--status-normal)' }} />
          </span>
          <div className="ops-stat-value text-mono">
            <span style={{ color: 'var(--status-normal)' }}>{stats.activeVehicles}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {' '}/ {stats.totalVehicles}
            </span>
          </div>
          <span className="ops-stat-meta text-mono">
            {stats.offlineVehicles} offline, {stats.maintenanceVehicles} maint.
          </span>
        </div>

        <div className="ops-stat-card">
          <span className="ops-stat-label">
            <span>Active Missions</span>
            <IconMissions size={13} style={{ color: 'var(--accent)' }} />
          </span>
          <div className="ops-stat-value text-mono">
            <span style={{ color: 'var(--accent)' }}>{stats.activeMissions}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {' '}/ {stats.totalMissions}
            </span>
          </div>
          <span className="ops-stat-meta text-mono">
            {stats.readyMissions} ready, {stats.plannedMissions} planned
          </span>
        </div>

        <div className="ops-stat-card">
          <span className="ops-stat-label">
            <span>Unread Events</span>
            <IconNotifications
              size={13}
              style={{
                color: stats.unreadNotifications > 0 ? 'var(--status-warning)' : 'var(--text-muted)',
              }}
            />
          </span>
          <div className="ops-stat-value text-mono">
            <span
              style={{
                color: stats.unreadNotifications > 0 ? 'var(--status-warning)' : 'inherit',
              }}
            >
              {stats.unreadNotifications}
            </span>
          </div>
          <span className="ops-stat-meta">Pending operator review</span>
        </div>

        <div className="ops-stat-card">
          <span className="ops-stat-label">
            <span>Missions Completed</span>
            <IconClock size={13} style={{ color: 'var(--text-secondary)' }} />
          </span>
          <div className="ops-stat-value text-mono">{stats.completedMissions}</div>
          <span className="ops-stat-meta">Historical archived sorties</span>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1rem' }}>
        {/* Left Column: Fleet & In-Flight Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Active Fleet Panel */}
          <div className="ops-panel">
            <div className="ops-panel__header">
              <h3 className="ops-panel__title">
                <IconVehicles size={14} />
                <span>Fleet Registry Snapshot</span>
              </h3>
              <Link to="/vehicles" className="btn btn--ghost btn--xs">
                <span>View Registry</span>
                <IconExternalLink size={11} />
              </Link>
            </div>
            {isLoading ? (
              <div className="ops-empty-state">
                <div className="ops-spinner" />
                <span className="ops-empty-desc">Querying fleet registry...</span>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="ops-empty-state">
                <p className="ops-empty-title">No vehicles registered</p>
                <p className="ops-empty-desc">Register vehicles in the fleet module to begin monitoring.</p>
                <Link to="/vehicles" className="btn btn--primary btn--xs">
                  <IconPlus size={12} />
                  <span>Register Vehicle</span>
                </Link>
              </div>
            ) : (
              <div className="ops-table-container" style={{ border: 'none' }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Callsign</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice(0, 6).map((v) => (
                      <tr key={v.id}>
                        <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                          #{v.id}
                        </td>
                        <td>
                          <strong>{v.name}</strong>
                        </td>
                        <td>
                          <span className="tag tag--type">{v.type}</span>
                        </td>
                        <td>
                          <span className={`tag tag--${v.status.toLowerCase()}`}>
                            <span className="tag-dot" />
                            {v.status}
                          </span>
                        </td>
                        <td>
                          <div className="ops-table-actions">
                            <Link
                              to={`/telemetry?vehicleId=${v.id}`}
                              className="btn btn--ghost btn--xs"
                              title="Live Telemetry"
                            >
                              <IconRadio size={11} />
                              <span>Live</span>
                            </Link>
                            <Link
                              to={`/alerts?vehicleId=${v.id}`}
                              className="btn btn--ghost btn--xs"
                              title="Vehicle Alerts"
                            >
                              <IconAlerts size={11} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Missions Panel */}
          <div className="ops-panel">
            <div className="ops-panel__header">
              <h3 className="ops-panel__title">
                <IconMissions size={14} />
                <span>Active & Prepared Missions</span>
              </h3>
              <Link to="/missions" className="btn btn--ghost btn--xs">
                <span>All Missions</span>
                <IconExternalLink size={11} />
              </Link>
            </div>
            {isLoading ? (
              <div className="ops-empty-state">
                <div className="ops-spinner" />
                <span className="ops-empty-desc">Loading operational missions...</span>
              </div>
            ) : activeOrReadyMissions.length === 0 ? (
              <div className="ops-empty-state">
                <p className="ops-empty-title">No active or ready missions</p>
                <p className="ops-empty-desc">All sorties are either planned or completed.</p>
                <Link to="/missions" className="btn btn--secondary btn--xs">
                  <span>Open Mission Operations</span>
                </Link>
              </div>
            ) : (
              <div className="ops-table-container" style={{ border: 'none' }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Mission Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Vehicle</th>
                      <th style={{ textAlign: 'right' }}>Telemetry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrReadyMissions.map((m) => (
                      <tr key={m.id}>
                        <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                          #{m.id}
                        </td>
                        <td>
                          <strong>{m.name}</strong>
                        </td>
                        <td>
                          <span className="tag tag--type">{m.type}</span>
                        </td>
                        <td>
                          <span className={`tag tag--${m.status.toLowerCase()}`}>
                            <span className="tag-dot" />
                            {m.status}
                          </span>
                        </td>
                        <td className="text-mono">
                          {m.vehicleId ? `#${m.vehicleId}` : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {m.vehicleId ? (
                            <Link
                              to={`/telemetry?vehicleId=${m.vehicleId}`}
                              className="btn btn--secondary btn--xs"
                            >
                              <IconTelemetry size={11} />
                              <span>Feed</span>
                            </Link>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Events Feed & Quick Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Recent Events / Notifications */}
          <div className="ops-panel">
            <div className="ops-panel__header">
              <h3 className="ops-panel__title">
                <IconNotifications size={14} />
                <span>Recent System Notifications</span>
              </h3>
              <Link to="/notifications" className="btn btn--ghost btn--xs">
                <span>View All ({notifications.length})</span>
                <IconExternalLink size={11} />
              </Link>
            </div>
            {isLoading ? (
              <div className="ops-empty-state">
                <div className="ops-spinner" />
                <span className="ops-empty-desc">Loading notifications...</span>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="ops-empty-state">
                <p className="ops-empty-title">No notifications received</p>
                <p className="ops-empty-desc">Operational messaging queue is clear.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: n.read ? 'transparent' : 'rgba(56, 189, 248, 0.04)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '2px' }}>
                        {!n.read && (
                          <span
                            className="tag tag--warning"
                            style={{ padding: '1px 4px', fontSize: '9px' }}
                          >
                            UNREAD
                          </span>
                        )}
                        <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          Alert Ref #{n.alertId}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)' }}>
                        {n.message}
                      </p>
                    </div>
                    <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatTimestamp(n.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Operational Navigation Panel */}
          <div className="ops-panel">
            <div className="ops-panel__header">
              <h3 className="ops-panel__title">
                <span>Quick Operations</span>
              </h3>
            </div>
            <div className="ops-panel__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <Link to="/vehicles" className="btn btn--secondary btn--sm" style={{ justifyContent: 'flex-start' }}>
                <IconVehicles size={13} />
                <span>Fleet Registry</span>
              </Link>
              <Link to="/missions" className="btn btn--secondary btn--sm" style={{ justifyContent: 'flex-start' }}>
                <IconMissions size={13} />
                <span>Mission Dispatch</span>
              </Link>
              <Link to="/telemetry" className="btn btn--secondary btn--sm" style={{ justifyContent: 'flex-start' }}>
                <IconRadio size={13} />
                <span>Telemetry Monitor</span>
              </Link>
              <Link to="/alerts" className="btn btn--secondary btn--sm" style={{ justifyContent: 'flex-start' }}>
                <IconAlerts size={13} />
                <span>Incident Log</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
