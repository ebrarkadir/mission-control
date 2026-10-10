import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { missionApi } from '../api/missionApi';
import { vehicleApi } from '../api/vehicleApi';
import { useAuth } from '../auth/AuthContext';
import {
  IconCheckCircle,
  IconClose,
  IconPlus,
  IconRadio,
  IconRefresh,
  IconStopCircle,
  IconVehicles,
} from '../components/Icons';
import { ApiError } from '../types/api';
import type {
  CreateMissionRequest,
  Mission,
  MissionType,
} from '../types/mission';
import type { Vehicle } from '../types/vehicle';

const MISSION_TYPES: MissionType[] = [
  'SURVEILLANCE',
  'RECONNAISSANCE',
  'DELIVERY',
  'PATROL',
];

function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function MissionsPage() {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [missions, setMissions] = useState<Mission[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignModalMission, setAssignModalMission] = useState<Mission | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState<CreateMissionRequest>({
    name: '',
    type: 'SURVEILLANCE',
  });

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inFlightMissionId, setInFlightMissionId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [missionsData, vehiclesData] = await Promise.all([
        missionApi.getAll(),
        vehicleApi.getAll(),
      ]);
      setMissions(missionsData);
      setVehicles(vehiclesData);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to load mission data';
      setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const vehicleMap = useMemo(() => {
    const map = new Map<number, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const busyVehicleIds = useMemo(() => {
    const set = new Set<number>();
    missions.forEach((m) => {
      if (
        (m.status === 'READY' || m.status === 'ACTIVE') &&
        m.vehicleId !== null
      ) {
        set.add(m.vehicleId);
      }
    });
    return set;
  }, [missions]);

  const stats = useMemo(() => {
    const total = missions.length;
    const planned = missions.filter((m) => m.status === 'PLANNED').length;
    const ready = missions.filter((m) => m.status === 'READY').length;
    const active = missions.filter((m) => m.status === 'ACTIVE').length;
    const completed = missions.filter((m) => m.status === 'COMPLETED').length;
    const aborted = missions.filter((m) => m.status === 'ABORTED').length;
    return { total, planned, ready, active, completed, aborted };
  }, [missions]);

  // Create Handlers
  const handleOpenCreateModal = () => {
    setCreateForm({ name: '', type: 'SURVEILLANCE' });
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setActionError('Mission callsign / name is required.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await missionApi.create({
        name: createForm.name.trim(),
        type: createForm.type,
      });
      setIsCreateModalOpen(false);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to create mission.';
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign Vehicle Handlers
  const handleOpenAssignModal = (mission: Mission) => {
    setAssignModalMission(mission);
    setSelectedVehicleId(mission.vehicleId ?? null);
    setActionError(null);
  };

  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignModalMission || selectedVehicleId === null) {
      setActionError('Please select a vehicle to assign.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await missionApi.assignVehicle(assignModalMission.id, {
        vehicleId: selectedVehicleId,
      });
      setAssignModalMission(null);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to assign vehicle to mission.';
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lifecycle transitions
  const handleStartMission = async (id: number) => {
    setInFlightMissionId(id);
    setActionError(null);
    try {
      await missionApi.start(id);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to start mission.';
      setActionError(message);
    } finally {
      setInFlightMissionId(null);
    }
  };

  const handleCompleteMission = async (id: number) => {
    setInFlightMissionId(id);
    setActionError(null);
    try {
      await missionApi.complete(id);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to complete mission.';
      setActionError(message);
    } finally {
      setInFlightMissionId(null);
    }
  };

  const handleAbortMission = async (id: number) => {
    setInFlightMissionId(id);
    setActionError(null);
    try {
      await missionApi.abort(id);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to abort mission.';
      setActionError(message);
    } finally {
      setInFlightMissionId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="ops-page-header">
        <div className="ops-page-title">
          <h2>Mission Operations</h2>
          <p>Tactical sorties planning, platform assignment, and flight lifecycle execution</p>
        </div>
        <div className="ops-header-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <IconRefresh size={12} />
            <span>Refresh</span>
          </button>
          {canModify && (
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleOpenCreateModal}
            >
              <IconPlus size={12} />
              <span>Plan Mission</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="ops-stats-row">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Total Missions</span>
          <span className="ops-stat-value text-mono">{stats.total}</span>
          <span className="ops-stat-meta">Lifetime sorties</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">In-Flight / Active</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--status-normal)' }}>
            {stats.active}
          </span>
          <span className="ops-stat-meta">Currently running</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Ready / Assigned</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--accent)' }}>
            {stats.ready}
          </span>
          <span className="ops-stat-meta">Awaiting start command</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Planned</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--text-secondary)' }}>
            {stats.planned}
          </span>
          <span className="ops-stat-meta">Unassigned sorties</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Completed / Aborted</span>
          <span className="ops-stat-value text-mono">
            {stats.completed} / {stats.aborted}
          </span>
          <span className="ops-stat-meta">Past operational record</span>
        </div>
      </div>

      {/* Error alert banner */}
      {(fetchError || actionError) && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{fetchError || actionError}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="ops-table-container">
        {isLoading ? (
          <div className="ops-empty-state">
            <div className="ops-spinner" />
            <span className="ops-empty-desc">Loading operational mission logs...</span>
          </div>
        ) : missions.length === 0 ? (
          <div className="ops-empty-state">
            <p className="ops-empty-title">No missions planned</p>
            <p className="ops-empty-desc">Create your first operational mission to assign unmanned units.</p>
            {canModify && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={handleOpenCreateModal}
              >
                <IconPlus size={12} />
                <span>Plan First Mission</span>
              </button>
            )}
          </div>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th>Mission Callout</th>
                <th style={{ width: '130px' }}>Type</th>
                <th style={{ width: '120px' }}>Status</th>
                <th>Assigned Unit</th>
                <th>Started</th>
                <th>Completed</th>
                <th style={{ textAlign: 'right', width: '260px' }}>Lifecycle Controls</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => {
                const assignedVehicle = m.vehicleId ? vehicleMap.get(m.vehicleId) : null;
                const isOperating = inFlightMissionId === m.id;

                return (
                  <tr key={m.id}>
                    <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                      #{m.id}
                    </td>
                    <td>
                      <strong style={{ letterSpacing: '0.02em' }}>{m.name}</strong>
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
                    <td>
                      {assignedVehicle ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <IconVehicles size={12} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontWeight: 500 }}>{assignedVehicle.name}</span>
                          <span className="tag tag--type" style={{ fontSize: '9px', padding: '1px 4px' }}>
                            {assignedVehicle.type}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Unassigned</span>
                      )}
                    </td>
                    <td className="text-mono" style={{ color: 'var(--text-secondary)' }}>
                      {formatDateTime(m.startedAt)}
                    </td>
                    <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                      {formatDateTime(m.completedAt)}
                    </td>
                    <td>
                      <div className="ops-table-actions">
                        {/* Telemetry stream link if vehicle assigned */}
                        {m.vehicleId && (
                          <Link
                            to={`/telemetry?vehicleId=${m.vehicleId}`}
                            className="btn btn--ghost btn--xs"
                            title="Monitor Live Telemetry"
                          >
                            <IconRadio size={11} />
                            <span>Feed</span>
                          </Link>
                        )}

                        {canModify && (
                          <>
                            {(m.status === 'PLANNED' || m.status === 'READY') && (
                              <button
                                type="button"
                                className="btn btn--secondary btn--xs"
                                onClick={() => handleOpenAssignModal(m)}
                                disabled={isOperating}
                              >
                                <span>{m.vehicleId ? 'Reassign' : 'Assign'}</span>
                              </button>
                            )}

                            {m.status === 'READY' && (
                              <button
                                type="button"
                                className="btn btn--primary btn--xs"
                                onClick={() => void handleStartMission(m.id)}
                                disabled={isOperating}
                              >
                                <span>Start</span>
                              </button>
                            )}

                            {m.status === 'ACTIVE' && (
                              <button
                                type="button"
                                className="btn btn--secondary btn--xs"
                                onClick={() => void handleCompleteMission(m.id)}
                                disabled={isOperating}
                                style={{ color: 'var(--status-normal)' }}
                              >
                                <IconCheckCircle size={11} />
                                <span>Complete</span>
                              </button>
                            )}

                            {(m.status === 'READY' || m.status === 'ACTIVE') && (
                              <button
                                type="button"
                                className="btn btn--danger btn--xs"
                                onClick={() => void handleAbortMission(m.id)}
                                disabled={isOperating}
                              >
                                <IconStopCircle size={11} />
                                <span>Abort</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE MISSION MODAL */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Plan New Mission</h3>
                <p>Define operational mission objective and sortie profile</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
              >
                <IconClose size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert-banner alert-banner--error">{actionError}</div>
                )}

                <div className="field">
                  <label htmlFor="create-mis-name">Mission Callout / Name</label>
                  <input
                    id="create-mis-name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Operation Nightfall, Recon-Sector-4"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="field">
                  <label htmlFor="create-mis-type">Sortie Profile / Type</label>
                  <select
                    id="create-mis-type"
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        type: e.target.value as MissionType,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    {MISSION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Planning...' : 'Create Mission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN VEHICLE MODAL */}
      {assignModalMission && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Assign Platform: {assignModalMission.name}</h3>
                <p>Select deployable ACTIVE unit for this sortie</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setAssignModalMission(null)}
              >
                <IconClose size={14} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert-banner alert-banner--error">{actionError}</div>
                )}

                <div className="field">
                  <label htmlFor="assign-veh-select">Select Deployable Platform</label>
                  <select
                    id="assign-veh-select"
                    value={selectedVehicleId ?? ''}
                    onChange={(e) =>
                      setSelectedVehicleId(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">-- Choose Active Platform --</option>
                    {vehicles.map((v) => {
                      const isAssignedToThis = v.id === assignModalMission.vehicleId;
                      const isBusy =
                        busyVehicleIds.has(v.id) && !isAssignedToThis;
                      const isNotActive = v.status !== 'ACTIVE';
                      const disabled = isBusy || isNotActive;

                      return (
                        <option
                          key={v.id}
                          value={v.id}
                          disabled={disabled}
                        >
                          {v.name} (#{v.id}) [{v.type}] - {v.status}
                          {isAssignedToThis
                            ? ' (Currently Assigned)'
                            : isBusy
                            ? ' (Assigned to other active mission)'
                            : isNotActive
                            ? ' (Not Active)'
                            : ' (Deployable)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setAssignModalMission(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={isSubmitting || selectedVehicleId === null}
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
