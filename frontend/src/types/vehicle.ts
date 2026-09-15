export type VehicleType = 'UAV' | 'UGV';

export type VehicleStatus = 'ACTIVE' | 'OFFLINE' | 'MAINTENANCE';

export interface Vehicle {
  id: number;
  name: string;
  type: VehicleType;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  name: string;
  type: VehicleType;
  status: VehicleStatus;
}

export interface UpdateVehicleRequest {
  name: string;
  type: VehicleType;
  status: VehicleStatus;
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatus;
}
