export type AlertType = 'LOW_BATTERY' | 'HIGH_TEMPERATURE' | 'CONNECTION_LOST';
export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'RESOLVED';

export interface Alert {
  id: number;
  vehicleId: number;
  telemetryRecordId: number | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
}
