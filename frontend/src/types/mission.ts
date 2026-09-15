export type MissionType =
  | 'SURVEILLANCE'
  | 'RECONNAISSANCE'
  | 'DELIVERY'
  | 'PATROL';

export type MissionStatus =
  | 'PLANNED'
  | 'READY'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ABORTED';

export interface Mission {
  id: number;
  name: string;
  type: MissionType;
  status: MissionStatus;
  vehicleId: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMissionRequest {
  name: string;
  type: MissionType;
}

export interface AssignVehicleRequest {
  vehicleId: number;
}
