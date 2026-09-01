package com.missioncontrol.vehicle.dto;

import java.time.Instant;

import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;

public record VehicleResponse(
        Long id,
        String name,
        VehicleType type,
        VehicleStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}