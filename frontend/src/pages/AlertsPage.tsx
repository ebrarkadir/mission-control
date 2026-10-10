import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { alertApi } from '../api/alertApi';
import { vehicleApi } from '../api/vehicleApi';
import {
  IconBattery,
  IconCheck,
  IconRadio,
  IconRefresh,
  IconThermometer,
} from '../components/Icons';
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

function renderTypeTag(type: AlertType) {
  switch (type) {
    case 'LOW_BATTERY':
      return (
        <span className="tag tag--warning">
          <IconBattery size={11} />
          <span>LOW BATTERY</span>
        </span>
      );
    case 'HIGH_TEMPERATURE':
      return (
        <span className="tag tag--critical">
          <IconThermometer size={11} />
          <span>HIGH TEMP</span>
        </span>
      );
    case 'CONNECTION_LOST':
      return (
        <span className="tag tag--critical">
          <IconRadio size={11} />
          <span>LINK LOST</span>
        </span>
      );
  }
}

function renderSeverityTag(severity: AlertSeverity) {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className="tag tag--critical">
          <span>CRITICAL</span>
        </span>
      );
    case 'WARNING':
      return (
        <span className="tag tag--warning">
          <span>WARNING</span>
        </span>
      );
  }
}

function renderStatusTag(status: AlertStatus) {
  switch (status) {
    case 'OPEN':
      return (
        <span className="tag tag--critical">
          <span className="tag-dot" />
          <span>OPEN</span>
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="tag tag--resolved">
          <IconCheck size={10} />
          <span>RESOLVED</span>
        </span>
      );
  }
}

export function AlertsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVehicleId = searchParams.get('vehicleId');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    initialVehicleId ? Number(initialVehicleId) : null,
  );
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
      setSearchParams({ vehicleId: String(selectedVehicleId) }, { replace: true });
      void loadAlerts(selectedVehicleId);
    } else {
      setAlerts([]);
    }
  }, [selectedVehicleId, loadAlerts, setSearchParams]);

  // Metrics
  const metrics = useMemo(() => {
    const total = alerts.length;
    const open = alerts.filter((a) => a.status === 'OPEN').length;
    const resolved = alerts.filter((a) => a.status === 'RESOLVED').length;
    const critical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length;
    return { total, open, resolved, critical };
  }, [alerts]);

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
      <div className="ops-page-header">
        <div className="ops-page-title">
          <h2>Incident & Alert Logs</h2>
          <p>Autonomous unit safety anomalies, telemetry thresholds, and automated event resolution</p>
        </div>
        <div className="ops-header-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleRefresh}
            disabled={isLoadingAlerts || selectedVehicleId === null}
          >
            <IconRefresh size={12} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Target Unit Selector Toolbar */}
      <div className="ops-toolbar">
        <div className="ops-toolbar__group">
          <span className="ops-label">Target Unit:</span>
          {isLoadingVehicles ? (
            <span style={{ color: 'var(--text-muted)' }}>Loading fleet...</span>
          ) : vehicles.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No vehicles in registry</span>
          ) : (
            <select
              className="select"
              style={{ width: 'auto', minWidth: '260px' }}
              value={selectedVehicleId ?? ''}
              onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  #{v.id} {v.name} [{v.type}] — {v.status}
                </option>
              ))}
            </select>
          )}

          {selectedVehicle && (
            <span className={`tag tag--${selectedVehicle.status.toLowerCase()}`}>
              <span className="tag-dot" />
              {selectedVehicle.status}
            </span>
          )}
        </div>

        {/* Filter View Controls */}
        <div className="ops-toolbar__group">
          <span className="ops-label">Filter:</span>
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn btn--xs ${
                statusFilter === filter ? 'btn--primary' : 'btn--secondary'
              }`}
              onClick={() => setStatusFilter(filter)}
            >
              <span>{filter}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="ops-stats-row">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Total Incidents</span>
          <span className="ops-stat-value text-mono">{metrics.total}</span>
          <span className="ops-stat-meta">Lifetime recorded</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Open Incidents</span>
          <span
            className="ops-stat-value text-mono"
            style={{ color: metrics.open > 0 ? 'var(--status-warning)' : 'inherit' }}
          >
            {metrics.open}
          </span>
          <span className="ops-stat-meta">Pending clearance</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Open Critical</span>
          <span
            className="ops-stat-value text-mono"
            style={{ color: metrics.critical > 0 ? 'var(--status-critical)' : 'inherit' }}
          >
            {metrics.critical}
          </span>
          <span className="ops-stat-meta">Immediate operational risk</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Resolved</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--status-normal)' }}>
            {metrics.resolved}
          </span>
          <span className="ops-stat-meta">Auto-cleared telemetry</span>
        </div>
      </div>

      {/* Error alert banner */}
      {error && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="ops-table-container">
        {isLoadingAlerts ? (
          <div className="ops-empty-state">
            <div className="ops-spinner" />
            <span className="ops-empty-desc">Fetching incident records from alert service...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="ops-empty-state">
            <p className="ops-empty-title">No incidents matching filter</p>
            <p className="ops-empty-desc">
              {statusFilter === 'OPEN'
                ? 'All alerts for this unit are currently resolved.'
                : 'No alert entries logged for this unmanned unit.'}
            </p>
          </div>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th style={{ width: '130px' }}>Type</th>
                <th style={{ width: '90px' }}>Severity</th>
                <th style={{ width: '100px' }}>Status</th>
                <th>Incident Message</th>
                <th style={{ width: '140px' }}>Timestamp</th>
                <th style={{ width: '140px' }}>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const isOpenCritical = alert.status === 'OPEN' && alert.severity === 'CRITICAL';

                return (
                  <tr
                    key={alert.id}
                    style={{
                      backgroundColor: isOpenCritical
                        ? 'rgba(239, 68, 68, 0.05)'
                        : alert.status === 'RESOLVED'
                        ? 'transparent'
                        : 'rgba(245, 158, 11, 0.03)',
                    }}
                  >
                    <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                      #{alert.id}
                    </td>
                    <td>{renderTypeTag(alert.type)}</td>
                    <td>{renderSeverityTag(alert.severity)}</td>
                    <td>{renderStatusTag(alert.status)}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: alert.status === 'OPEN' ? 600 : 400,
                          color: alert.status === 'OPEN' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {alert.message}
                      </span>
                    </td>
                    <td className="text-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {formatDateTime(alert.createdAt)}
                    </td>
                    <td className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {formatDateTime(alert.resolvedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
