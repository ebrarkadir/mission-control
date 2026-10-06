package com.missioncontrol.alertservice.dto;

import java.time.Instant;

public record LatestTelemetryResponse(
        Long id,
        Long vehicleId,
        Instant createdAt) {
}