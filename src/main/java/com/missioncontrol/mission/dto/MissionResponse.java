package com.missioncontrol.mission.dto;

import java.time.Instant;

import com.missioncontrol.mission.entity.MissionStatus;
import com.missioncontrol.mission.entity.MissionType;

public record MissionResponse(
        Long id,
        String name,
        MissionType type,
        MissionStatus status,
        Long vehicleId,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
}