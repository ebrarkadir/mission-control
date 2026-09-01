package com.missioncontrol.vehicle.dto;

import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;

public record CreateVehicleRequest(
        String name,
        VehicleType type,
        VehicleStatus status
) {
}