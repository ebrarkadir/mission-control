package com.missioncontrol.alert.dto;

import java.time.Instant;

import com.missioncontrol.alert.entity.AlertSeverity;
import com.missioncontrol.alert.entity.AlertStatus;
import com.missioncontrol.alert.entity.AlertType;

public record AlertResponse(
        Long id,
        Long vehicleId,
        Long telemetryRecordId,
        AlertType type,
        AlertSeverity severity,
        String message,
        AlertStatus status,
        Instant createdAt,
        Instant resolvedAt
) {
}