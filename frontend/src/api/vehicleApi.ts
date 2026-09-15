import { apiClient } from './apiClient';
import type {
  CreateVehicleRequest,
  UpdateVehicleRequest,
  UpdateVehicleStatusRequest,
  Vehicle,
} from '../types/vehicle';

export const vehicleApi = {
  getAll: (): Promise<Vehicle[]> => {
    return apiClient<Vehicle[]>('/api/vehicles');
  },

  getById: (id: number): Promise<Vehicle> => {
    return apiClient<Vehicle>(`/api/vehicles/${id}`);
  },

  create: (request: CreateVehicleRequest): Promise<Vehicle> => {
    return apiClient<Vehicle>('/api/vehicles', {
      method: 'POST',
      body: request,
    });
  },

  update: (id: number, request: UpdateVehicleRequest): Promise<Vehicle> => {
    return apiClient<Vehicle>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: request,
    });
  },

  updateStatus: (
    id: number,
    request: UpdateVehicleStatusRequest,
  ): Promise<Vehicle> => {
    return apiClient<Vehicle>(`/api/vehicles/${id}/status`, {
      method: 'PATCH',
      body: request,
    });
  },
};
