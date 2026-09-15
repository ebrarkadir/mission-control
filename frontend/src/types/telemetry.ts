export interface TelemetryRecord {
  id: number;
  vehicleId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  battery: number;
  temperature: number;
  recordedAt: string;
  createdAt: string;
}

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

export interface TelemetryStreamOptions {
  onMessage: (data: TelemetryRecord) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
}

export interface TelemetryStreamSubscription {
  disconnect: () => void;
}
