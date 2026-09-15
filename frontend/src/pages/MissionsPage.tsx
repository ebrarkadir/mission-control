import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { missionApi } from '../api/missionApi';
import { vehicleApi } from '../api/vehicleApi';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../types/api';
import type {
  CreateMissionRequest,
  Mission,
  MissionStatus,
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

function getStatusBadgeClass(status: MissionStatus): string {
  switch (status) {
    case 'PLANNED':
      return 'status-badge status-badge--planned';
    case 'READY':
      return 'status-badge status-badge--ready';
    case 'ACTIVE':
      return 'status-badge status-badge--active';
    case 'COMPLETED':
      return 'status-badge status-badge--completed';
    case 'ABORTED':
      return 'status-badge status-badge--aborted';
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

  // Vehicle lookup map
  const vehicleMap = useMemo(() => {
    const map = new Map<number, Vehicle>();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  // Busy vehicles (vehicles currently assigned to other READY or ACTIVE missions)
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

  // Stats calculation
  const stats = useMemo(() => {
    const total = missions.length;
    const planned = missions.filter((m) => m.status === 'PLANNED').length;
    const ready = missions.filter((m) => m.status === 'READY').length;
    const active = missions.filter((m) => m.status === 'ACTIVE').length;
    const completed = missions.filter((m) => m.status === 'COMPLETED').length;
    const aborted = missions.filter((m) => m.status === 'ABORTED').length;
    return { total, planned, ready, active, completed, aborted };
  }, [missions]);

  // Create Mission Handlers
  const handleOpenCreateModal = () => {
    setCreateForm({ name: '', type: 'SURVEILLANCE' });
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setActionError('Mission name is required.');
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

  // Lifecycle transitions: Start, Complete, Abort
  const handleStartMission = async (mission: Mission) => {
    setInFlightMissionId(mission.id);
    setActionError(null);
    try {
      await missionApi.start(mission.id);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to start mission.';
      alert(message);
    } finally {
      setInFlightMissionId(null);
    }
  };

  const handleCompleteMission = async (mission: Mission) => {
    setInFlightMissionId(mission.id);
    setActionError(null);
    try {
      await missionApi.complete(mission.id);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to complete mission.';
      alert(message);
    } finally {
      setInFlightMissionId(null);
    }
  };

  const handleAbortMission = async (mission: Mission) => {
    const confirmed = window.confirm(
      `Are you sure you want to ABORT mission "${mission.name}"? This action is irreversible.`,
    );
    if (!confirmed) return;

    setInFlightMissionId(mission.id);
    setActionError(null);
    try {
      await missionApi.abort(mission.id);
      await loadData();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to abort mission.';
      alert(message);
    } finally {
      setInFlightMissionId(null);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h2>Operational Missions</h2>
          <p>Mission lifecycle tracking, fleet assignment, and tactical commands</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={loadData}
            disabled={isLoading}
          >
            Refresh
          </button>
          {canModify && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleOpenCreateModal}
            >
              + New Mission
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-chip">
          <span className="stats-chip__label">Total Missions:</span>
          <span className="stats-chip__value">{stats.total}</span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Planned:</span>
          <span className="stats-chip__value">{stats.planned}</span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Ready:</span>
          <span className="stats-chip__value">{stats.ready}</span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Active:</span>
          <span className="stats-chip__value stats-chip__value--accent">
            {stats.active}
          </span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Completed:</span>
          <span className="stats-chip__value">{stats.completed}</span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Aborted:</span>
          <span className="stats-chip__value">{stats.aborted}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="data-table-wrapper">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading mission operations...</p>
          </div>
        ) : fetchError ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#9888;</div>
            <h4>Failed to Load Missions</h4>
            <p>{fetchError}</p>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={loadData}
            >
              Retry
            </button>
          </div>
        ) : missions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#127919;</div>
            <h4>No Missions Registered</h4>
            <p>There are no operational missions planned. Plan a new mission.</p>
            {canModify && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={handleOpenCreateModal}
              >
                + Plan First Mission
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Mission Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assigned Vehicle</th>
                  <th>Started At</th>
                  <th>Completed At</th>
                  {canModify && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => {
                  const assignedVehicle =
                    m.vehicleId !== null ? vehicleMap.get(m.vehicleId) : null;
                  const isOperating = inFlightMissionId === m.id;

                  return (
                    <tr key={m.id}>
                      <td>
                        <span className="text-mono text-muted">#{m.id}</span>
                      </td>
                      <td>
                        <strong>{m.name}</strong>
                      </td>
                      <td>
                        <span className="type-badge">{m.type}</span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(m.status)}>
                          {m.status}
                        </span>
                      </td>
                      <td>
                        {assignedVehicle ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong>{assignedVehicle.name}</strong>
                            <span className="text-mono text-muted" style={{ fontSize: '0.75rem' }}>
                              (#{assignedVehicle.id})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{formatDateTime(m.startedAt)}</td>
                      <td className="text-muted">{formatDateTime(m.completedAt)}</td>
                      {canModify && (
                        <td style={{ textAlign: 'right' }}>
                          <div
                            className="btn-group"
                            style={{ justifyContent: 'flex-end' }}
                          >
                            {/* PLANNED: Assign Vehicle */}
                            {m.status === 'PLANNED' && (
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                onClick={() => handleOpenAssignModal(m)}
                                disabled={isOperating}
                              >
                                Assign Vehicle
                              </button>
                            )}

                            {/* READY: Reassign Vehicle or Start Mission */}
                            {m.status === 'READY' && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn--secondary btn--sm"
                                  onClick={() => handleOpenAssignModal(m)}
                                  disabled={isOperating}
                                  title="Change assigned vehicle"
                                >
                                  Reassign
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--success btn--sm"
                                  onClick={() => handleStartMission(m)}
                                  disabled={isOperating}
                                >
                                  {isOperating ? 'Starting...' : 'Start'}
                                </button>
                              </>
                            )}

                            {/* ACTIVE: Complete or Abort */}
                            {m.status === 'ACTIVE' && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn--success btn--sm"
                                  onClick={() => handleCompleteMission(m)}
                                  disabled={isOperating}
                                >
                                  {isOperating ? 'Completing...' : 'Complete'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--danger btn--sm"
                                  onClick={() => handleAbortMission(m)}
                                  disabled={isOperating}
                                >
                                  {isOperating ? 'Aborting...' : 'Abort'}
                                </button>
                              </>
                            )}

                            {/* COMPLETED or ABORTED: No further actions */}
                            {(m.status === 'COMPLETED' ||
                              m.status === 'ABORTED') && (
                              <span
                                className="text-muted"
                                style={{ fontSize: '0.8rem' }}
                              >
                                Finished
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MISSION MODAL */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Plan New Mission</h3>
                <p>Register mission tactical profile in PLANNED status</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert alert--error">{actionError}</div>
                )}

                <label className="field">
                  <span>Mission Name</span>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="e.g. Operation Northern Watch, Perimeter Sweep"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </label>

                <label className="field">
                  <span>Mission Type</span>
                  <select
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
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Plan Mission'}
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
                <h3>Assign Vehicle to Mission</h3>
                <p>
                  Assigning vehicle to &quot;{assignModalMission.name}&quot; (Status: {assignModalMission.status})
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setAssignModalMission(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert alert--error">{actionError}</div>
                )}

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Note: By operational rules, only <strong>ACTIVE</strong> vehicles that are not currently engaged in other READY or ACTIVE missions can be assigned.
                </p>

                <label className="field">
                  <span>Select Active Vehicle</span>
                  <select
                    value={selectedVehicleId ?? ''}
                    onChange={(e) =>
                      setSelectedVehicleId(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <option value="">-- Choose a Vehicle --</option>
                    {vehicles.map((v) => {
                      const isCurrentMissionVehicle =
                        assignModalMission.vehicleId === v.id;
                      const isBusy =
                        busyVehicleIds.has(v.id) && !isCurrentMissionVehicle;
                      const isNotActive = v.status !== 'ACTIVE';
                      const isDisabled = isBusy || isNotActive;

                      let label = `${v.name} (#${v.id}) [${v.type} - ${v.status}]`;
                      if (isCurrentMissionVehicle) {
                        label += ' (Currently Assigned)';
                      } else if (isBusy) {
                        label += ' (Busy in another mission)';
                      } else if (isNotActive) {
                        label += ' (Inactive)';
                      }

                      return (
                        <option
                          key={v.id}
                          value={v.id}
                          disabled={isDisabled}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setAssignModalMission(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting || selectedVehicleId === null}
                >
                  {isSubmitting ? 'Assigning...' : 'Assign & Set Ready'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
