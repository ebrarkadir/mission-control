package com.missioncontrol.mission.dto;

import jakarta.validation.constraints.NotNull;

public record AssignVehicleRequest(

        @NotNull
        Long vehicleId

) {
}