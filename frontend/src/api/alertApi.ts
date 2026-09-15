import { apiClient } from './apiClient';
import type { Alert } from '../types/alert';

export const alertApi = {
  getByVehicleId(vehicleId: number): Promise<Alert[]> {
    return apiClient<Alert[]>(`/api/vehicles/${vehicleId}/alerts`);
  },
};
