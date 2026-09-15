import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import { vehicleApi } from '../api/vehicleApi';
import { useAuth } from '../auth/AuthContext';
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

function getStatusBadgeClass(status: VehicleStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'status-badge status-badge--active';
    case 'OFFLINE':
      return 'status-badge status-badge--offline';
    case 'MAINTENANCE':
      return 'status-badge status-badge--maintenance';
  }
}

export function VehiclesPage() {
  const { user } = useAuth();
  const canModify = user?.role === 'ADMIN' || user?.role === 'OPERATOR';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal states
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

  // Submit states & error messages
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

  // Stats calculation
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
      {/* Header */}
      <div className="page-header">
        <div className="page-header__title">
          <h2>Fleet Registry</h2>
          <p>Manage autonomous unmanned vehicles and operational fleet status</p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={fetchVehicles}
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
              + New Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-chip">
          <span className="stats-chip__label">Total Fleet:</span>
          <span className="stats-chip__value">{stats.total}</span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Active:</span>
          <span className="stats-chip__value stats-chip__value--accent">
            {stats.active}
          </span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Offline:</span>
          <span className="stats-chip__value">{stats.offline}</span>
        </div>
        <div className="stats-chip">
          <span className="stats-chip__label">Maintenance:</span>
          <span className="stats-chip__value">{stats.maintenance}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="data-table-wrapper">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Loading vehicle registry...</p>
          </div>
        ) : fetchError ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#9888;</div>
            <h4>Failed to Load Vehicles</h4>
            <p>{fetchError}</p>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={fetchVehicles}
            >
              Retry
            </button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">&#128747;</div>
            <h4>No Vehicles Registered</h4>
            <p>The fleet registry is currently empty. Add your first vehicle.</p>
            {canModify && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={handleOpenCreateModal}
              >
                + Register First Vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  {canModify && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="text-mono text-muted">#{v.id}</span>
                    </td>
                    <td>
                      <strong>{v.name}</strong>
                    </td>
                    <td>
                      <span className="type-badge">{v.type}</span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(v.status)}>
                        {v.status}
                      </span>
                    </td>
                    <td className="text-muted">{formatDateTime(v.createdAt)}</td>
                    <td className="text-muted">{formatDateTime(v.updatedAt)}</td>
                    {canModify && (
                      <td style={{ textAlign: 'right' }}>
                        <div
                          className="btn-group"
                          style={{ justifyContent: 'flex-end' }}
                        >
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => handleOpenStatusModal(v)}
                          >
                            Status
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleOpenEditModal(v)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE VEHICLE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Register Vehicle</h3>
                <p>Add a new autonomous unit to the fleet registry</p>
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
                  <span>Vehicle Name</span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Falcon-1, Rover-Alpha"
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </label>

                <label className="field">
                  <span>Vehicle Type</span>
                  <select
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
                        {t === 'UAV'
                          ? 'UAV (Unmanned Aerial Vehicle)'
                          : 'UGV (Unmanned Ground Vehicle)'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Initial Status</span>
                  <select
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
                  {isSubmitting ? 'Registering...' : 'Register Vehicle'}
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
                <h3>Edit Vehicle #{editingVehicle.id}</h3>
                <p>Modify vehicle specification and parameters</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setEditingVehicle(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert alert--error">{actionError}</div>
                )}

                <label className="field">
                  <span>Vehicle Name</span>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </label>

                <label className="field">
                  <span>Vehicle Type</span>
                  <select
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
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Operational Status</span>
                  <select
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
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setEditingVehicle(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STATUS MODAL */}
      {statusTargetVehicle && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <h3>Change Status: {statusTargetVehicle.name}</h3>
                <p>Update operational availability in real-time</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => !isSubmitting && setStatusTargetVehicle(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleStatusSubmit}>
              <div className="modal-body">
                {actionError && (
                  <div className="alert alert--error">{actionError}</div>
                )}

                <label className="field">
                  <span>Select New Status</span>
                  <select
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
                </label>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setStatusTargetVehicle(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
