import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { vehicleApi } from '../api/vehicleApi';
import { useAuth } from '../auth/AuthContext';
import {
  IconAlerts,
  IconClose,
  IconEdit,
  IconPlus,
  IconRadio,
  IconRefresh,
  IconSettings,
} from '../components/Icons';
import { ApiError } from '../types/api';
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UpdateVehicleStatusRequest,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from '../types/vehicle';

const VEHICLE_TYPES: VehicleType[] = ['UAV', 'UGV'];
const VEHICLE_STATUSES: VehicleStatus[] = ['ACTIVE', 'OFFLINE', 'MAINTENANCE'];

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

export function VehiclesPage() {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [statusTargetVehicle, setStatusTargetVehicle] = useState<Vehicle | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateVehicleRequest>({
    name: '',
    type: 'UAV',
    status: 'ACTIVE',
  });
  const [editForm, setEditForm] = useState<UpdateVehicleRequest>({
    name: '',
    type: 'UAV',
    status: 'ACTIVE',
  });
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus>('ACTIVE');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await vehicleApi.getAll();
      setVehicles(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to load vehicles';
      setFetchError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter((v) => v.status === 'ACTIVE').length;
    const offline = vehicles.filter((v) => v.status === 'OFFLINE').length;
    const maintenance = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
    return { total, active, offline, maintenance };
  }, [vehicles]);

  // Create Handlers
  const handleOpenCreateModal = () => {
    setCreateForm({ name: '', type: 'UAV', status: 'ACTIVE' });
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      setActionError('Vehicle name is required.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await vehicleApi.create({
        name: createForm.name.trim(),
        type: createForm.type,
        status: createForm.status,
      });
      setIsCreateModalOpen(false);
      await fetchVehicles();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to create vehicle.';
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Handlers
  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditForm({
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
    });
    setActionError(null);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    if (!editForm.name.trim()) {
      setActionError('Vehicle name is required.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      await vehicleApi.update(editingVehicle.id, {
        name: editForm.name.trim(),
        type: editForm.type,
        status: editForm.status,
      });
      setEditingVehicle(null);
      await fetchVehicles();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to update vehicle.';
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Change Handlers
  const handleOpenStatusModal = (vehicle: Vehicle) => {
    setStatusTargetVehicle(vehicle);
    setSelectedStatus(vehicle.status);
    setActionError(null);
  };

  const handleStatusSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!statusTargetVehicle) return;

    setIsSubmitting(true);
    setActionError(null);
    try {
      const request: UpdateVehicleStatusRequest = { status: selectedStatus };
      await vehicleApi.updateStatus(statusTargetVehicle.id, request);
      setStatusTargetVehicle(null);
      await fetchVehicles();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to update vehicle status.';
      setActionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="ops-page-header">
        <div className="ops-page-title">
          <h2>Fleet Registry</h2>
          <p>Autonomous unmanned air & ground units inventory and status tracking</p>
        </div>
        <div className="ops-header-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchVehicles}
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
              <span>Register Unit</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Row */}
      <div className="ops-stats-row">
        <div className="ops-stat-card">
          <span className="ops-stat-label">Total Fleet</span>
          <span className="ops-stat-value text-mono">{stats.total}</span>
          <span className="ops-stat-meta">Registered units</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Active Units</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--status-normal)' }}>
            {stats.active}
          </span>
          <span className="ops-stat-meta">Mission deployable</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Offline</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--status-critical)' }}>
            {stats.offline}
          </span>
          <span className="ops-stat-meta">Signal unlinked</span>
        </div>
        <div className="ops-stat-card">
          <span className="ops-stat-label">Maintenance</span>
          <span className="ops-stat-value text-mono" style={{ color: 'var(--status-warning)' }}>
            {stats.maintenance}
          </span>
          <span className="ops-stat-meta">Servicing / docked</span>
        </div>
      </div>

      {/* Main Table or State */}
      {fetchError && (
        <div className="alert-banner alert-banner--error" role="alert">
          <span>{fetchError}</span>
        </div>
      )}

      <div className="ops-table-container">
        {isLoading ? (
          <div className="ops-empty-state">
            <div className="ops-spinner" />
            <span className="ops-empty-desc">Loading fleet registry...</span>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="ops-empty-state">
            <p className="ops-empty-title">Fleet registry is empty</p>
            <p className="ops-empty-desc">No unmanned units are currently registered.</p>
            {canModify && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={handleOpenCreateModal}
              >
                <IconPlus size={12} />
                <span>Register First Unit</span>
              </button>
            )}
          </div>
        ) : (
          <table className="ops-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th>Callsign</th>
                <th style={{ width: '90px' }}>Platform</th>
                <th style={{ width: '130px' }}>Status</th>
                <th>Registered</th>
                <th>Updated</th>
                <th style={{ textAlign: 'right', width: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                    #{v.id}
                  </td>
                  <td>
                    <strong style={{ letterSpacing: '0.02em' }}>{v.name}</strong>
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
                  <td className="text-mono" style={{ color: 'var(--text-secondary)' }}>
                    {formatDateTime(v.createdAt)}
                  </td>
                  <td className="text-mono" style={{ color: 'var(--text-muted)' }}>
                    {formatDateTime(v.updatedAt)}
                  </td>
                  <td>
                    <div className="ops-table-actions">
                      <Link
                        to={`/telemetry?vehicleId=${v.id}`}
                        className="btn btn--ghost btn--xs"
                        title="Live Telemetry"
                      >
                        <IconRadio size={11} />
                        <span>Stream</span>
                      </Link>
                      <Link
                        to={`/alerts?vehicleId=${v.id}`}
                        className="btn btn--ghost btn--xs"
                        title="Vehicle Alerts"
                      >
                        <IconAlerts size={11} />
                        <span>Alerts</span>
                      </Link>
                      {canModify && (
                        <>
                          <button
                            type="button"
                            className="btn btn--secondary btn--xs"
                            onClick={() => handleOpenStatusModal(v)}
                            title="Update Status"
                          >
                            <IconSettings size={11} />
                            <span>State</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--xs"
                            onClick={() => handleOpenEditModal(v)}
                            title="Edit Vehicle"
                          >
                            <IconEdit size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE VEHICLE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Register Unmanned Unit</h3>
                <p>Assign callsign and operational platform type</p>
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
                  <label htmlFor="create-veh-name">Callsign / Name</label>
                  <input
                    id="create-veh-name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Talon-01, Peregrine-Alpha"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="field">
                  <label htmlFor="create-veh-type">Platform Type</label>
                  <select
                    id="create-veh-type"
                    value={createForm.type}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        type: e.target.value as VehicleType,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t} — {t === 'UAV' ? 'Unmanned Aerial Vehicle' : 'Unmanned Ground Vehicle'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="create-veh-status">Initial Readiness Status</label>
                  <select
                    id="create-veh-status"
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        status: e.target.value as VehicleStatus,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    {VEHICLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
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
                  {isSubmitting ? 'Registering...' : 'Register Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {editingVehicle && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Edit Unit #{editingVehicle.id}</h3>
                <p>Modify callsign, platform, or operational profile</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setEditingVehicle(null)}
              >
                <IconClose size={14} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert-banner alert-banner--error">{actionError}</div>
                )}

                <div className="field">
                  <label htmlFor="edit-veh-name">Callsign / Name</label>
                  <input
                    id="edit-veh-name"
                    type="text"
                    required
                    maxLength={100}
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="field">
                  <label htmlFor="edit-veh-type">Platform Type</label>
                  <select
                    id="edit-veh-type"
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        type: e.target.value as VehicleType,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t} — {t === 'UAV' ? 'Unmanned Aerial Vehicle' : 'Unmanned Ground Vehicle'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="edit-veh-status">Operational Status</label>
                  <select
                    id="edit-veh-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        status: e.target.value as VehicleStatus,
                      })
                    }
                    disabled={isSubmitting}
                  >
                    {VEHICLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setEditingVehicle(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {statusTargetVehicle && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Set Status: {statusTargetVehicle.name}</h3>
                <p>Update operational readiness state</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setStatusTargetVehicle(null)}
              >
                <IconClose size={14} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert-banner alert-banner--error">{actionError}</div>
                )}

                <div className="field">
                  <label htmlFor="select-status">Target Readiness State</label>
                  <select
                    id="select-status"
                    value={selectedStatus}
                    onChange={(e) =>
                      setSelectedStatus(e.target.value as VehicleStatus)
                    }
                    disabled={isSubmitting}
                  >
                    {VEHICLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => setStatusTargetVehicle(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary btn--sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
