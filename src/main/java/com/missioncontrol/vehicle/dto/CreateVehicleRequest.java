package com.missioncontrol.vehicle.dto;

import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateVehicleRequest(

        @NotBlank
        @Size(max = 100)
        String name,

        @NotNull
        VehicleType type,

        @NotNull
        VehicleStatus status
) {
}