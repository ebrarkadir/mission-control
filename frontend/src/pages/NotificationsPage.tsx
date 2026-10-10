import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { notificationApi } from '../api/notificationApi';
import {
  IconCheck,
  IconNotifications,
  IconRefresh,
} from '../components/Icons';
import { useNotification } from '../context/NotificationContext';
import { ApiError } from '../types/api';
import type { NotificationItem } from '../types/notification';

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
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
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter: ALL, UNREAD, READ
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  // Track pending mark-as-read IDs
  const [markingIds, setMarkingIds] = useState<Set<number>>(new Set());

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setActionError(null);
    try {
      const data = await notificationApi.getAll();
      setNotifications(data);
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

    setActionError(null);
    setMarkingIds((prev) => new Set(prev).add(id));
    try {
      const updated = await notificationApi.markAsRead(id);
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
          : 'Failed to acknowledge notification';
      setActionError(message);
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
    <div className="ops-page">
      {/* Page Header */}
      <div className="ops-page-header">
        <div className="ops-page-title">
          <h2>Notification Feed</h2>
          <p>
            Operator dispatch events, incident notifications, and telemetry threshold triggers
          </p>
        </div>
        <div className="ops-header-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            <IconRefresh size={13} />
            <span>{isLoading ? 'Syncing...' : 'Sync Feed'}</span>
          </button>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="ops-stats-row ops-stats-row--3">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Total Events</span>
          <span className="ops-stat-value text-mono">{metrics.total}</span>
          <span className="ops-stat-meta">Recorded notifications</span>
        </div>

        <div className="ops-stat-card">
          <span className="ops-stat-label">Unacknowledged</span>
          <span
            className="ops-stat-value text-mono"
            style={{ color: metrics.unread > 0 ? 'var(--status-warning)' : 'inherit' }}
          >
            {metrics.unread}
          </span>
          <span className="ops-stat-meta">Action required</span>
        </div>

        <div className="ops-stat-card">
          <span className="ops-stat-label">Acknowledged</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--text-secondary)' }}>
            {metrics.read}
          </span>
          <span className="ops-stat-meta">Archived in log</span>
        </div>
      </div>

      {/* Inline banners */}
      {error && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {actionError && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Panel */}
      <div className="ops-panel">
        <div className="ops-panel__header">
          <div className="ops-panel__title">
            <IconNotifications size={14} style={{ color: 'var(--accent)' }} />
            <span>Dispatch Inbox</span>
            <span className="text-muted" style={{ fontSize: '11px', fontWeight: 400 }}>
              ({filteredNotifications.length} of {notifications.length} displayed)
            </span>
          </div>

          <div className="ops-panel__toolbar">
            <div className="btn-group">
              <button
                type="button"
                className={`btn btn--xs ${filter === 'ALL' ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={() => setFilter('ALL')}
              >
                ALL ({metrics.total})
              </button>
              <button
                type="button"
                className={`btn btn--xs ${filter === 'UNREAD' ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={() => setFilter('UNREAD')}
              >
                UNREAD ({metrics.unread})
              </button>
              <button
                type="button"
                className={`btn btn--xs ${filter === 'READ' ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={() => setFilter('READ')}
              >
                READ ({metrics.read})
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="ops-empty-state">
            <div className="ops-spinner" />
            <span style={{ fontSize: '12px', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              Querying notification service...
            </span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="ops-empty-state">
            <IconNotifications size={24} style={{ color: 'var(--text-muted)' }} />
            <h4 className="ops-empty-title">
              {filter === 'UNREAD' ? 'Inbox Clear' : 'No Events Found'}
            </h4>
            <p className="ops-empty-desc">
              {filter === 'UNREAD'
                ? 'All operator notifications have been acknowledged.'
                : 'No notification records match the current filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="ops-table-container">
            <table className="ops-table">
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>State</th>
                  <th>Notification Message</th>
                  <th style={{ width: '100px' }}>Alert Ref</th>
                  <th style={{ width: '160px' }}>Timestamp</th>
                  <th style={{ width: '160px' }}>Acknowledged</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Action</th>
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
                          <span className="tag tag--warning">
                            <span className="tag-dot" />
                            UNREAD
                          </span>
                        ) : (
                          <span className="tag tag--neutral">
                            READ
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: !item.read ? 600 : 400,
                            color: !item.read ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {item.message}
                        </span>
                      </td>
                      <td>
                        <Link
                          to="/alerts"
                          className="text-mono"
                          style={{
                            color: 'var(--accent)',
                            fontSize: '11px',
                            textDecoration: 'none',
                          }}
                          title="View incident log"
                        >
                          #{item.alertId}
                        </Link>
                      </td>
                      <td>
                        <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {formatDateTime(item.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className="text-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDateTime(item.readAt)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!item.read ? (
                          <button
                            type="button"
                            className="btn btn--secondary btn--xs"
                            onClick={() => handleMarkAsRead(item.id)}
                            disabled={isMarking}
                          >
                            <IconCheck size={11} />
                            <span>{isMarking ? 'Updating...' : 'Ack'}</span>
                          </button>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '11px' }}>
                            Ack'd
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
