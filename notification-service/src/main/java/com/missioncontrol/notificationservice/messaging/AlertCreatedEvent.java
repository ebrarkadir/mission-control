package com.missioncontrol.notificationservice.messaging;

import java.time.Instant;

public record AlertCreatedEvent(
        Long alertId,
        Long vehicleId,
        String type,
        String severity,
        String message,
        Instant createdAt
) {
}