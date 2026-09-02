package com.missioncontrol.vehicle.dto;

import com.missioncontrol.vehicle.entity.VehicleStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateVehicleStatusRequest(

        @NotNull
        VehicleStatus status
) {
}