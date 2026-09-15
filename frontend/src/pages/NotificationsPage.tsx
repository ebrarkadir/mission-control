import { useCallback, useEffect, useMemo, useState } from 'react';

import { notificationApi } from '../api/notificationApi';
import { useNotification } from '../context/NotificationContext';
import { ApiError } from '../types/api';
import type { NotificationItem } from '../types/notification';

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function NotificationsPage() {
  const { refreshUnreadCount, decrementUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter: ALL, UNREAD, READ
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  // Track pending mark-as-read IDs
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notificationApi.getAll();
      setNotifications(data);
      // Synchronize unread count with backend
      void refreshUnreadCount();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to load notifications';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    if (markingIds.has(id)) return;

    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await notificationApi.markAsRead(id);
      // Update local state without full reload
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, read: true, readAt: updated.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
      decrementUnreadCount();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to mark notification as read';
      alert(message);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const metrics = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const read = notifications.filter((n) => n.read).length;
    return { total, unread, read };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'UNREAD') return notifications.filter((n) => !n.read);
    if (filter === 'READ') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h2>System Notifications</h2>
          <p>Operator notifications, automated incident alerts, and dispatch messaging</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Notifications'}
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <article className="stat-card">
          <span className="stat-card__label">Total Notifications</span>
          <strong className="stat-card__value">{metrics.total}</strong>
          <span className="stat-card__meta">Received events</span>
        </article>

        <article className={`stat-card ${metrics.unread > 0 ? 'stat-card--warning' : ''}`}>
          <span className="stat-card__label">Unread Notifications</span>
          <strong
            className="stat-card__value"
            style={{ color: metrics.unread > 0 ? '#f39c12' : 'inherit' }}
          >
            {metrics.unread}
          </strong>
          <span className="stat-card__meta">Pending acknowledgment</span>
        </article>

        <article className="stat-card">
          <span className="stat-card__label">Read / Acknowledged</span>
          <strong className="stat-card__value" style={{ color: 'var(--accent)' }}>
            {metrics.read}
          </strong>
          <span className="stat-card__meta">Archived history</span>
        </article>
      </div>

      {/* Filter Bar */}
      <div className="telemetry-toolbar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filter View:</span>
          {(['ALL', 'UNREAD', 'READ'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`btn btn--sm ${filter === f ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'UNREAD' ? `UNREAD (${metrics.unread})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Notifications Table */}
      <div className="data-table-wrapper">
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Notification Feed</h3>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Showing {filteredNotifications.length} of {notifications.length} events
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading notification feed...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#128276;</div>
            <h4>No Notifications</h4>
            <p>
              {filter === 'UNREAD'
                ? 'All caught up! No unread notifications.'
                : 'No notifications found in the system log.'}
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Alert ID</th>
                  <th>Received</th>
                  <th>Read At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((item) => {
                  const isMarking = markingIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={!item.read ? 'notification-row--unread' : undefined}
                    >
                      <td>
                        {!item.read ? (
                          <span className="alert-badge alert-badge--unread">● UNREAD</span>
                        ) : (
                          <span className="alert-badge alert-badge--status-resolved">
                            ✓ READ
                          </span>
                        )}
                      </td>
                      <td>
                        <strong
                          style={{
                            color: !item.read ? '#fff' : 'var(--text-muted)',
                            fontWeight: !item.read ? 600 : 400,
                          }}
                        >
                          {item.message}
                        </strong>
                      </td>
                      <td>
                        <span className="text-mono text-muted">#{item.alertId}</span>
                      </td>
                      <td>
                        <span className="text-mono text-muted">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className="text-mono text-muted">
                          {formatDateTime(item.readAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!item.read ? (
                          <button
                            type="button"
                            className="btn btn--sm btn--primary"
                            onClick={() => handleMarkAsRead(item.id)}
                            disabled={isMarking}
                          >
                            {isMarking ? 'Updating...' : 'Mark as Read'}
                          </button>
                        ) : (
                          <span
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.85rem',
                            }}
                          >
                            Acknowledged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
