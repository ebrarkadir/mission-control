package com.missioncontrol.telemetryservice.exception;

public class TelemetryNotFoundException extends RuntimeException {

    public TelemetryNotFoundException(Long vehicleId) {
        super("Telemetry not found for vehicle: " + vehicleId);
    }
}