import { apiClient } from './apiClient';
import type {
  AssignVehicleRequest,
  CreateMissionRequest,
  Mission,
} from '../types/mission';

export const missionApi = {
  getAll: (): Promise<Mission[]> => {
    return apiClient<Mission[]>('/api/missions');
  },

  getById: (id: number): Promise<Mission> => {
    return apiClient<Mission>(`/api/missions/${id}`);
  },

  create: (request: CreateMissionRequest): Promise<Mission> => {
    return apiClient<Mission>('/api/missions', {
      method: 'POST',
      body: request,
    });
  },

  assignVehicle: (
    id: number,
    request: AssignVehicleRequest,
  ): Promise<Mission> => {
    return apiClient<Mission>(`/api/missions/${id}/vehicle`, {
      method: 'PATCH',
      body: request,
    });
  },

  start: (id: number): Promise<Mission> => {
    return apiClient<Mission>(`/api/missions/${id}/start`, {
      method: 'PATCH',
    });
  },

  complete: (id: number): Promise<Mission> => {
    return apiClient<Mission>(`/api/missions/${id}/complete`, {
      method: 'PATCH',
    });
  },

  abort: (id: number): Promise<Mission> => {
    return apiClient<Mission>(`/api/missions/${id}/abort`, {
      method: 'PATCH',
    });
  },
};
