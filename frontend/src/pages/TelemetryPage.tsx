import { useCallback, useEffect, useMemo, useState } from 'react';

import { telemetryApi } from '../api/telemetryApi';
import { vehicleApi } from '../api/vehicleApi';
import { ApiError } from '../types/api';
import type { ConnectionStatus, TelemetryRecord } from '../types/telemetry';
import type { Vehicle } from '../types/vehicle';

function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 2,
    });
  } catch {
    return isoString;
  }
}

function formatCoordinates(lat?: number, lng?: number): string {
  if (lat === undefined || lng === undefined) return '-';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

export function TelemetryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryRecord | null>(null);
  const [history, setHistory] = useState<TelemetryRecord[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Load vehicles registry
  const loadVehicles = useCallback(async () => {
    setIsLoadingVehicles(true);
    try {
      const data = await vehicleApi.getAll();
      setVehicles(data);

      // Auto-select first active vehicle or first available vehicle if none selected
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
      console.error('Failed to load vehicles for telemetry:', err);
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  // Selected vehicle object
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  }, [vehicles, selectedVehicleId]);

  // Handle stream subscription and initial data load
  useEffect(() => {
    if (!selectedVehicleId) {
      setLatestTelemetry(null);
      setHistory([]);
      setConnectionStatus('DISCONNECTED');
      return;
    }

    let isSubscribed = true;
    setIsLoadingInitial(true);
    setStreamError(null);
    setLatestTelemetry(null);
    setHistory([]);

    async function loadInitialData() {
      try {
        const [latestRes, historyRes] = await Promise.allSettled([
          telemetryApi.getLatest(selectedVehicleId!),
          telemetryApi.getHistory(selectedVehicleId!),
        ]);

        if (!isSubscribed) return;

        if (latestRes.status === 'fulfilled') {
          setLatestTelemetry(latestRes.value);
        } else {
          // 404 means no telemetry has been recorded yet
          if (
            latestRes.reason instanceof ApiError &&
            latestRes.reason.status === 404
          ) {
            setLatestTelemetry(null);
          }
        }

        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value);
        } else {
          setHistory([]);
        }
      } finally {
        if (isSubscribed) {
          setIsLoadingInitial(false);
        }
      }
    }

    void loadInitialData();

    // Start SSE stream subscription
    const subscription = telemetryApi.subscribeStream(selectedVehicleId, {
      onMessage: (record: TelemetryRecord) => {
        if (!isSubscribed) return;
        setLatestTelemetry(record);
        setHistory((prev) => {
          // Prevent duplicates by ID and keep last 100 entries
          const filtered = prev.filter((item) => item.id !== record.id);
          return [record, ...filtered].slice(0, 100);
        });
      },
      onStatusChange: (status: ConnectionStatus) => {
        if (!isSubscribed) return;
        setConnectionStatus(status);
        if (status === 'CONNECTED') {
          setStreamError(null);
        }
      },
      onError: (err: Error) => {
        if (!isSubscribed) return;
        setStreamError(err.message);
      },
    });

    return () => {
      isSubscribed = false;
      subscription.disconnect();
    };
  }, [selectedVehicleId]);

  // Battery evaluation
  const batteryLevel = latestTelemetry?.battery ?? 0;
  const batteryStatusClass =
    batteryLevel >= 50
      ? 'telemetry-card--normal'
      : batteryLevel >= 20
      ? 'telemetry-card--warning'
      : 'telemetry-card--critical';

  const batteryBarClass =
    batteryLevel >= 50
      ? 'battery-gauge__fill--normal'
      : batteryLevel >= 20
      ? 'battery-gauge__fill--warning'
      : 'battery-gauge__fill--critical';

  // Temperature evaluation
  const tempLevel = latestTelemetry?.temperature ?? 0;
  const tempStatusClass =
    tempLevel > 70 ? 'telemetry-card--critical' : 'telemetry-card--normal';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h2>Live Telemetry Stream</h2>
          <p>Real-time vehicle telemetry feeds, sensor readings, and flight dynamics</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={loadVehicles}
            disabled={isLoadingVehicles}
          >
            Refresh Fleet
          </button>
        </div>
      </div>

      {/* Vehicle Selector & Connection Status Toolbar */}
      <div className="telemetry-toolbar">
        <div className="telemetry-selector-group">
          <label htmlFor="vehicle-select">Target Vehicle:</label>
          {isLoadingVehicles ? (
            <span className="text-muted">Loading fleet...</span>
          ) : vehicles.length === 0 ? (
            <span className="text-muted">No vehicles available in registry</span>
          ) : (
            <select
              id="vehicle-select"
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

        {/* Real-time Connection Status Badge */}
        <div>
          <span
            className={`connection-badge connection-badge--${connectionStatus.toLowerCase()}`}
          >
            <span className="connection-dot" />
            SSE: {connectionStatus}
          </span>
        </div>
      </div>

      {streamError && (
        <div className="alert alert--error" style={{ marginBottom: '1.5rem' }}>
          Stream Error: {streamError}. Attempting automatic reconnect...
        </div>
      )}

      {/* Main Content */}
      {isLoadingVehicles ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Initializing telemetry module...</p>
        </div>
      ) : !selectedVehicle ? (
        <div className="empty-state">
          <div className="empty-state__icon">&#128747;</div>
          <h4>No Vehicle Selected</h4>
          <p>Please register or select a vehicle to monitor its live telemetry.</p>
        </div>
      ) : (
        <>
          {/* Live Sensor Metrics Grid */}
          <div className="telemetry-grid">
            {/* Battery */}
            <article className={`telemetry-card ${batteryStatusClass}`}>
              <div className="telemetry-card__header">
                <span className="telemetry-card__label">Battery Level</span>
                <span className="telemetry-card__icon">&#128267;</span>
              </div>
              <div className="telemetry-card__body">
                <span className="telemetry-card__value">
                  {latestTelemetry ? latestTelemetry.battery : '--'}
                </span>
                <span className="telemetry-card__unit">%</span>
              </div>
              <div>
                <div className="battery-gauge">
                  <div
                    className={`battery-gauge__fill ${batteryBarClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, batteryLevel))}%` }}
                  />
                </div>
                <div className="telemetry-card__footer" style={{ marginTop: '0.4rem' }}>
                  <span>Status</span>
                  <span>
                    {batteryLevel >= 50
                      ? 'Normal'
                      : batteryLevel >= 20
                      ? 'Warning'
                      : 'Critical'}
                  </span>
                </div>
              </div>
            </article>

            {/* Temperature */}
            <article className={`telemetry-card ${tempStatusClass}`}>
              <div className="telemetry-card__header">
                <span className="telemetry-card__label">Temperature</span>
                <span className="telemetry-card__icon">&#127777;</span>
              </div>
              <div className="telemetry-card__body">
                <span className="telemetry-card__value">
                  {latestTelemetry
                    ? latestTelemetry.temperature.toFixed(1)
                    : '--'}
                </span>
                <span className="telemetry-card__unit">°C</span>
              </div>
              <div className="telemetry-card__footer">
                <span>Threshold: 70°C</span>
                <span>{tempLevel > 70 ? 'HIGH TEMP' : 'Nominal'}</span>
              </div>
            </article>

            {/* Speed */}
            <article className="telemetry-card telemetry-card--normal">
              <div className="telemetry-card__header">
                <span className="telemetry-card__label">Ground Speed</span>
                <span className="telemetry-card__icon">&#9889;</span>
              </div>
              <div className="telemetry-card__body">
                <span className="telemetry-card__value">
                  {latestTelemetry ? latestTelemetry.speed.toFixed(1) : '--'}
                </span>
                <span className="telemetry-card__unit">km/h</span>
              </div>
              <div className="telemetry-card__footer">
                <span>Velocity</span>
                <span>{latestTelemetry?.speed ? 'In Motion' : 'Stationary'}</span>
              </div>
            </article>

            {/* Altitude */}
            <article className="telemetry-card telemetry-card--normal">
              <div className="telemetry-card__header">
                <span className="telemetry-card__label">Altitude</span>
                <span className="telemetry-card__icon">&#9650;</span>
              </div>
              <div className="telemetry-card__body">
                <span className="telemetry-card__value">
                  {latestTelemetry ? latestTelemetry.altitude.toFixed(1) : '--'}
                </span>
                <span className="telemetry-card__unit">m</span>
              </div>
              <div className="telemetry-card__footer">
                <span>Above Ground</span>
                <span>Barometric</span>
              </div>
            </article>

            {/* Coordinates */}
            <article className="telemetry-card">
              <div className="telemetry-card__header">
                <span className="telemetry-card__label">GPS Position</span>
                <span className="telemetry-card__icon">&#127757;</span>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  Lat: {latestTelemetry ? latestTelemetry.latitude.toFixed(5) : '--'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'monospace', marginTop: '0.2rem' }}>
                  Lng: {latestTelemetry ? latestTelemetry.longitude.toFixed(5) : '--'}
                </div>
              </div>
              <div className="telemetry-card__footer">
                <span>{formatCoordinates(latestTelemetry?.latitude, latestTelemetry?.longitude)}</span>
              </div>
            </article>

            {/* Last Telemetry Update */}
            <article className="telemetry-card">
              <div className="telemetry-card__header">
                <span className="telemetry-card__label">Last Telemetry</span>
                <span className="telemetry-card__icon">&#9201;</span>
              </div>
              <div className="telemetry-card__body">
                <span className="telemetry-card__value" style={{ fontSize: '1.25rem' }}>
                  {formatTimestamp(latestTelemetry?.recordedAt)}
                </span>
              </div>
              <div className="telemetry-card__footer">
                <span>Unit: #{selectedVehicle.id}</span>
                <span>{selectedVehicle.name}</span>
              </div>
            </article>
          </div>

          {/* Telemetry History Log */}
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
                  Telemetry Log Stream (Recent {history.length} records)
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Real-time telemetry event stream for vehicle #{selectedVehicle.id}
                </p>
              </div>
            </div>

            {isLoadingInitial ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p>Establishing initial telemetry buffer...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">&#128225;</div>
                <h4>No Telemetry Records Yet</h4>
                <p>
                  Waiting for telemetry broadcasts from vehicle &quot;{selectedVehicle.name}&quot;...
                </p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Battery</th>
                      <th>Temperature</th>
                      <th>Speed</th>
                      <th>Altitude</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      const isBatLow = record.battery < 20;
                      const isBatWarn = record.battery >= 20 && record.battery < 50;
                      const isTempHigh = record.temperature > 70;

                      return (
                        <tr key={record.id}>
                          <td>
                            <span className="text-mono">
                              {formatTimestamp(record.recordedAt)}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: isBatLow
                                  ? '#ffb4ab'
                                  : isBatWarn
                                  ? '#f39c12'
                                  : 'inherit',
                                fontWeight: isBatLow || isBatWarn ? 700 : 'normal',
                              }}
                            >
                              {record.battery}%
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: isTempHigh ? '#ffb4ab' : 'inherit',
                                fontWeight: isTempHigh ? 700 : 'normal',
                              }}
                            >
                              {record.temperature.toFixed(1)} °C
                            </span>
                          </td>
                          <td>{record.speed.toFixed(1)} km/h</td>
                          <td>{record.altitude.toFixed(1)} m</td>
                          <td className="text-mono text-muted">
                            {record.latitude.toFixed(5)}
                          </td>
                          <td className="text-mono text-muted">
                            {record.longitude.toFixed(5)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
