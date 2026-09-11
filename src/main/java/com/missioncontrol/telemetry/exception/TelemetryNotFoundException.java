package com.missioncontrol.telemetry.exception;

public class TelemetryNotFoundException extends RuntimeException {

    public TelemetryNotFoundException(Long vehicleId) {
        super("Telemetry not found for vehicle id: " + vehicleId);
    }
}