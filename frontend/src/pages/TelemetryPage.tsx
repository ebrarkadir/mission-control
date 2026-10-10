import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { telemetryApi } from '../api/telemetryApi';
import { vehicleApi } from '../api/vehicleApi';
import {
  IconAltitude,
  IconBattery,
  IconClock,
  IconCoordinates,
  IconGauge,
  IconRadio,
  IconRefresh,
  IconThermometer,
} from '../components/Icons';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialVehicleIdParam = searchParams.get('vehicleId');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    initialVehicleIdParam ? Number(initialVehicleIdParam) : null,
  );
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryRecord | null>(null);
  const [history, setHistory] = useState<TelemetryRecord[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [streamError, setStreamError] = useState<string | null>(null);

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
      console.error('Failed to load vehicles for telemetry:', err);
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

  // Handle stream subscription and initial data load
  useEffect(() => {
    if (!selectedVehicleId) {
      setLatestTelemetry(null);
      setHistory([]);
      setConnectionStatus('DISCONNECTED');
      return;
    }

    // Keep URL parameter synchronized
    setSearchParams({ vehicleId: String(selectedVehicleId) }, { replace: true });

    let isSubscribed = true;
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
          if (
            latestRes.reason instanceof ApiError &&
            latestRes.reason.status === 404
          ) {
            setLatestTelemetry(null);
          } else if (
            latestRes.reason instanceof ApiError &&
            latestRes.reason.status === 503
          ) {
            setStreamError(latestRes.reason.message);
          }
        }

        if (historyRes.status === 'fulfilled') {
          setHistory(historyRes.value);
        } else {
          setHistory([]);
          if (
            historyRes.reason instanceof ApiError &&
            historyRes.reason.status === 503
          ) {
            setStreamError(historyRes.reason.message);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          console.error('Initial telemetry fetch error:', err);
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
  }, [selectedVehicleId, setSearchParams]);

  // Metric evaluations
  const batteryLevel = latestTelemetry?.battery ?? 0;
  const tempLevel = latestTelemetry?.temperature ?? 0;

  const batteryColor =
    batteryLevel >= 50
      ? 'var(--status-normal)'
      : batteryLevel >= 20
      ? 'var(--status-warning)'
      : 'var(--status-critical)';

  const tempColor =
    tempLevel > 70
      ? 'var(--status-critical)'
      : tempLevel > 55
      ? 'var(--status-warning)'
      : 'var(--text-primary)';

  const statusLabel =
    connectionStatus === 'CONNECTED'
      ? 'LIVE'
      : connectionStatus === 'CONNECTING'
      ? 'CONNECTING'
      : connectionStatus === 'ERROR'
      ? 'ERROR'
      : 'OFFLINE';

  const statusTagClass =
    connectionStatus === 'CONNECTED'
      ? 'tag--active'
      : connectionStatus === 'CONNECTING'
      ? 'tag--warning'
      : connectionStatus === 'ERROR'
      ? 'tag--critical'
      : 'tag--neutral';

  return (
    <div>
      {/* Header */}
      <div className="ops-page-header">
        <div className="ops-page-title">
          <h2>Live Telemetry Stream</h2>
          <p>Real-time vehicle downlink packets, sensor diagnostics, and trajectory tracking</p>
        </div>
        <div className="ops-header-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={loadVehicles}
            disabled={isLoadingVehicles}
          >
            <IconRefresh size={12} />
            <span>Refresh Fleet</span>
          </button>
        </div>
      </div>

      {/* Target Selector & Stream Toolbar */}
      <div className="ops-toolbar">
        <div className="ops-toolbar__group">
          <span className="ops-label">Target Platform:</span>
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

        <div className="ops-toolbar__group">
          <span className="ops-label">Telemetry Stream:</span>
          <span className={`tag ${statusTagClass}`}>
            <span className="tag-dot" />
            <IconRadio size={11} />
            <span className="text-mono">{statusLabel}</span>
          </span>
        </div>
      </div>

      {/* Stream Error Alert if service degraded / circuit breaker tripped */}
      {streamError && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{streamError}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!selectedVehicle ? (
        <div className="ops-empty-state">
          <p className="ops-empty-title">No platform selected</p>
          <p className="ops-empty-desc">Select an unmanned unit from the toolbar to initiate telemetry stream.</p>
        </div>
      ) : (
        <>
          {/* Real-time Metric Sensor Tiles */}
          <div className="telemetry-grid">
            {/* Battery */}
            <div className="telemetry-tile">
              <div className="telemetry-tile__header">
                <span className="telemetry-tile__label">Battery State</span>
                <IconBattery size={14} style={{ color: batteryColor }} />
              </div>
              <div className="telemetry-tile__body">
                <span className="telemetry-tile__value" style={{ color: batteryColor }}>
                  {latestTelemetry ? latestTelemetry.battery : '--'}
                </span>
                <span className="telemetry-tile__unit">%</span>
              </div>
              <div className="compact-gauge">
                <div
                  className="compact-gauge__fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, batteryLevel))}%`,
                    backgroundColor: batteryColor,
                  }}
                />
              </div>
            </div>

            {/* Core Temperature */}
            <div className="telemetry-tile">
              <div className="telemetry-tile__header">
                <span className="telemetry-tile__label">Thermal Core</span>
                <IconThermometer size={14} style={{ color: tempColor }} />
              </div>
              <div className="telemetry-tile__body">
                <span className="telemetry-tile__value" style={{ color: tempColor }}>
                  {latestTelemetry ? latestTelemetry.temperature.toFixed(1) : '--'}
                </span>
                <span className="telemetry-tile__unit">°C</span>
              </div>
              <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {tempLevel > 70 ? 'CRITICAL TEMP' : tempLevel > 55 ? 'ELEVATED TEMP' : 'NOMINAL RANGE'}
              </span>
            </div>

            {/* Ground Speed */}
            <div className="telemetry-tile">
              <div className="telemetry-tile__header">
                <span className="telemetry-tile__label">Velocity</span>
                <IconGauge size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="telemetry-tile__body">
                <span className="telemetry-tile__value">
                  {latestTelemetry ? latestTelemetry.speed.toFixed(1) : '--'}
                </span>
                <span className="telemetry-tile__unit">m/s</span>
              </div>
              <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                {latestTelemetry ? `${(latestTelemetry.speed * 3.6).toFixed(1)} km/h` : '-- km/h'}
              </span>
            </div>

            {/* Altitude */}
            <div className="telemetry-tile">
              <div className="telemetry-tile__header">
                <span className="telemetry-tile__label">Altitude AGL</span>
                <IconAltitude size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="telemetry-tile__body">
                <span className="telemetry-tile__value">
                  {latestTelemetry ? latestTelemetry.altitude.toFixed(1) : '--'}
                </span>
                <span className="telemetry-tile__unit">m</span>
              </div>
              <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Barometric datum
              </span>
            </div>

            {/* Spatial Coordinates */}
            <div className="telemetry-tile" style={{ gridColumn: 'span 2' }}>
              <div className="telemetry-tile__header">
                <span className="telemetry-tile__label">GNSS Position</span>
                <IconCoordinates size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div className="telemetry-tile__body">
                <span className="telemetry-tile__value" style={{ fontSize: '16px' }}>
                  {latestTelemetry
                    ? formatCoordinates(latestTelemetry.latitude, latestTelemetry.longitude)
                    : '--'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  Lat: {latestTelemetry?.latitude.toFixed(6) ?? '--'} | Lon: {latestTelemetry?.longitude.toFixed(6) ?? '--'}
                </span>
                <span className="text-mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  <IconClock size={10} style={{ marginRight: '3px' }} />
                  {formatTimestamp(latestTelemetry?.recordedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Downlink History Table */}
          <div className="ops-panel">
            <div className="ops-panel__header">
              <h3 className="ops-panel__title">
                <IconRadio size={13} />
                <span>Downlink Packet History</span>
              </h3>
              <span className="ops-panel__meta text-mono">
                Buffer: {history.length} / 100 packets
              </span>
            </div>

            {history.length === 0 ? (
              <div className="ops-empty-state">
                <p className="ops-empty-title">Awaiting telemetry telemetry stream</p>
                <p className="ops-empty-desc">
                  No packets recorded yet for this platform. Ensure the vehicle is active.
                </p>
              </div>
            ) : (
              <div className="ops-table-container" style={{ border: 'none', maxHeight: '380px' }}>
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Packet</th>
                      <th>Time</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th style={{ textAlign: 'right' }}>Alt (m)</th>
                      <th style={{ textAlign: 'right' }}>Speed (m/s)</th>
                      <th style={{ textAlign: 'right' }}>Battery</th>
                      <th style={{ textAlign: 'right' }}>Temp (°C)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                          #{record.id}
                        </td>
                        <td className="text-mono">{formatTimestamp(record.recordedAt)}</td>
                        <td className="text-mono">{record.latitude.toFixed(5)}°</td>
                        <td className="text-mono">{record.longitude.toFixed(5)}°</td>
                        <td className="text-mono" style={{ textAlign: 'right' }}>
                          {record.altitude.toFixed(1)}
                        </td>
                        <td className="text-mono" style={{ textAlign: 'right' }}>
                          {record.speed.toFixed(1)}
                        </td>
                        <td
                          className="text-mono"
                          style={{
                            textAlign: 'right',
                            color:
                              record.battery < 20
                                ? 'var(--status-critical)'
                                : record.battery < 50
                                ? 'var(--status-warning)'
                                : 'inherit',
                          }}
                        >
                          {record.battery}%
                        </td>
                        <td
                          className="text-mono"
                          style={{
                            textAlign: 'right',
                            color: record.temperature > 70 ? 'var(--status-critical)' : 'inherit',
                          }}
                        >
                          {record.temperature.toFixed(1)}
                        </td>
                      </tr>
                    ))}
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
