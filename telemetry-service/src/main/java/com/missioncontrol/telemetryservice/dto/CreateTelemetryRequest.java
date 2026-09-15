package com.missioncontrol.telemetryservice.dto;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateTelemetryRequest(

        @Min(-90)
        @Max(90)
        double latitude,

        @Min(-180)
        @Max(180)
        double longitude,

        double altitude,

        @PositiveOrZero
        double speed,

        @Min(0)
        @Max(100)
        int battery,

        double temperature,

        @NotNull
        Instant recordedAt
) {
}