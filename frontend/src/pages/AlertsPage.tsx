import { useCallback, useEffect, useMemo, useState } from 'react';

import { alertApi } from '../api/alertApi';
import { vehicleApi } from '../api/vehicleApi';
import { ApiError } from '../types/api';
import type { Alert, AlertSeverity, AlertStatus, AlertType } from '../types/alert';
import type { Vehicle } from '../types/vehicle';

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

function getTypeBadge(type: AlertType) {
  switch (type) {
    case 'LOW_BATTERY':
      return <span className="alert-badge alert-badge--type-battery">⚡ LOW BATTERY</span>;
    case 'HIGH_TEMPERATURE':
      return <span className="alert-badge alert-badge--type-temp">🔥 HIGH TEMP</span>;
    case 'CONNECTION_LOST':
      return <span className="alert-badge alert-badge--type-conn">📡 CONNECTION LOST</span>;
  }
}

function getSeverityBadge(severity: AlertSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return <span className="alert-badge alert-badge--sev-critical">CRITICAL</span>;
    case 'WARNING':
      return <span className="alert-badge alert-badge--sev-warning">WARNING</span>;
  }
}

function getStatusBadge(status: AlertStatus) {
  switch (status) {
    case 'OPEN':
      return <span className="alert-badge alert-badge--status-open">● OPEN</span>;
    case 'RESOLVED':
      return <span className="alert-badge alert-badge--status-resolved">✓ RESOLVED</span>;
  }
}

export function AlertsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status filter: ALL, OPEN, RESOLVED
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  // Load vehicles registry
  const loadVehicles = useCallback(async () => {
    setIsLoadingVehicles(true);
    try {
      const data = await vehicleApi.getAll();
      setVehicles(data);

      if (data.length > 0) {
        setSelectedVehicleId((prev) => {
          if (prev && data.some((v) => v.id === prev)) {
            return prev;
          }
          const activeVehicle = data.find((v) => v.status === 'ACTIVE');
          return activeVehicle ? activeVehicle.id : data[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to load vehicles for alerts:', err);
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  }, [vehicles, selectedVehicleId]);

  // Load alerts for selected vehicle
  const loadAlerts = useCallback(async (vehicleId: number) => {
    setIsLoadingAlerts(true);
    setError(null);
    try {
      const data = await alertApi.getByVehicleId(vehicleId);
      setAlerts(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to fetch alerts';
      setError(message);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVehicleId !== null) {
      void loadAlerts(selectedVehicleId);
    } else {
      setAlerts([]);
    }
  }, [selectedVehicleId, loadAlerts]);

  // Metrics
  const metrics = useMemo(() => {
    const total = alerts.length;
    const open = alerts.filter((a) => a.status === 'OPEN').length;
    const resolved = alerts.filter((a) => a.status === 'RESOLVED').length;
    const critical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
    return { total, open, resolved, critical };
  }, [alerts]);

  // Filtered list
  const filteredAlerts = useMemo(() => {
    if (statusFilter === 'ALL') return alerts;
    return alerts.filter((a) => a.status === statusFilter);
  }, [alerts, statusFilter]);

  const handleRefresh = () => {
    if (selectedVehicleId !== null) {
      void loadAlerts(selectedVehicleId);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h2>Vehicle Alerts & Incidents</h2>
          <p>Real-time operational alerts, telemetry anomaly tracking, and resolution history</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleRefresh}
            disabled={isLoadingAlerts || selectedVehicleId === null}
          >
            {isLoadingAlerts ? 'Refreshing...' : 'Refresh Alerts'}
          </button>
        </div>
      </div>

      {/* Vehicle Selector Toolbar */}
      <div className="telemetry-toolbar">
        <div className="telemetry-selector-group">
          <label htmlFor="alert-vehicle-select">Target Vehicle:</label>
          {isLoadingVehicles ? (
            <span className="text-muted">Loading fleet...</span>
          ) : vehicles.length === 0 ? (
            <span className="text-muted">No vehicles available in registry</span>
          ) : (
            <select
              id="alert-vehicle-select"
              value={selectedVehicleId ?? ''}
              onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (#{v.id}) — [{v.type} | {v.status}]
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status Filter:</span>
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn btn--sm ${
                statusFilter === filter ? 'btn--primary' : 'btn--ghost'
              }`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
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

      {/* Metrics Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <article className="stat-card">
          <span className="stat-card__label">Total Alerts</span>
          <strong className="stat-card__value">{metrics.total}</strong>
          <span className="stat-card__meta">Recorded lifetime</span>
        </article>

        <article className={`stat-card ${metrics.open > 0 ? 'stat-card--warning' : ''}`}>
          <span className="stat-card__label">Open Alerts</span>
          <strong
            className="stat-card__value"
            style={{ color: metrics.open > 0 ? '#f39c12' : 'inherit' }}
          >
            {metrics.open}
          </strong>
          <span className="stat-card__meta">Requiring attention</span>
        </article>

        <article className={`stat-card ${metrics.critical > 0 ? 'stat-card--critical' : ''}`}>
          <span className="stat-card__label">Open Critical</span>
          <strong
            className="stat-card__value"
            style={{ color: metrics.critical > 0 ? 'var(--danger)' : 'inherit' }}
          >
            {metrics.critical}
          </strong>
          <span className="stat-card__meta">Immediate threat</span>
        </article>

        <article className="stat-card">
          <span className="stat-card__label">Resolved</span>
          <strong className="stat-card__value" style={{ color: 'var(--accent)' }}>
            {metrics.resolved}
          </strong>
          <span className="stat-card__meta">Normal state restored</span>
        </article>
      </div>

      {/* Alerts Table */}
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
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
              Alert History {selectedVehicle ? `for ${selectedVehicle.name} (#${selectedVehicle.id})` : ''}
            </h3>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Showing {filteredAlerts.length} of {alerts.length} total events
            </p>
          </div>
        </div>

        {isLoadingAlerts ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading vehicle alerts...</p>
          </div>
        ) : !selectedVehicle ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#128747;</div>
            <h4>No Vehicle Selected</h4>
            <p>Please select a vehicle to inspect alerts.</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#9989;</div>
            <h4>No Alerts Found</h4>
            <p>
              {statusFilter === 'ALL'
                ? `No alert records exist for vehicle "${selectedVehicle.name}". All systems are operating normally.`
                : `No ${statusFilter.toLowerCase()} alerts for vehicle "${selectedVehicle.name}".`}
            </p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Resolved At</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => {
                  const isOpenCritical = alert.status === 'OPEN' && alert.severity === 'CRITICAL';
                  return (
                    <tr
                      key={alert.id}
                      className={isOpenCritical ? 'alert-row--critical' : undefined}
                    >
                      <td>
                        <span className="text-mono">#{alert.id}</span>
                      </td>
                      <td>
                        <strong>{selectedVehicle.name}</strong>{' '}
                        <span className="text-muted text-mono">(#{alert.vehicleId})</span>
                      </td>
                      <td>{getTypeBadge(alert.type)}</td>
                      <td>{getSeverityBadge(alert.severity)}</td>
                      <td>
                        <span style={{ fontWeight: alert.status === 'OPEN' ? 600 : 'normal' }}>
                          {alert.message}
                        </span>
                      </td>
                      <td>{getStatusBadge(alert.status)}</td>
                      <td>
                        <span className="text-mono text-muted">
                          {formatDateTime(alert.createdAt)}
                        </span>
                      </td>
                      <td>
                        <span className="text-mono text-muted">
                          {formatDateTime(alert.resolvedAt)}
                        </span>
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
