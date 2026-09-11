package com.missioncontrol.telemetry.dto;

import java.time.Instant;

public record TelemetryResponse(
        Long id,
        Long vehicleId,
        double latitude,
        double longitude,
        double altitude,
        double speed,
        int battery,
        double temperature,
        Instant recordedAt,
        Instant createdAt
) {
}