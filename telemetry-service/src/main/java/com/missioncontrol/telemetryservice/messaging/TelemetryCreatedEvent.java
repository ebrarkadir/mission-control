package com.missioncontrol.telemetryservice.messaging;

import java.time.Instant;

public record TelemetryCreatedEvent(
        Long telemetryId,
        Long vehicleId,
        double latitude,
        double longitude,
        double altitude,
        double speed,
        int battery,
        double temperature,
        Instant recordedAt
) {
}