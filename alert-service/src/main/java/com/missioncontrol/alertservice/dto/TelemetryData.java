package com.missioncontrol.alertservice.dto;

import java.time.Instant;

public record TelemetryData(
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