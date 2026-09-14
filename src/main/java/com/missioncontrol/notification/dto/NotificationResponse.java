package com.missioncontrol.notification.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        Long alertId,
        String message,
        boolean read,
        Instant readAt,
        Instant createdAt
) {
}