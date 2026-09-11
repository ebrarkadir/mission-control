package com.missioncontrol.telemetry.dto;

import java.time.Instant;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateTelemetryRequest(

        @NotNull
        @DecimalMin("-90.0")
        @DecimalMax("90.0")
        Double latitude,

        @NotNull
        @DecimalMin("-180.0")
        @DecimalMax("180.0")
        Double longitude,

        @NotNull
        Double altitude,

        @NotNull
        @DecimalMin("0.0")
        Double speed,

        @NotNull
        @Min(0)
        @Max(100)
        Integer battery,

        @NotNull
        Double temperature,

        @NotNull
        Instant recordedAt
) {
}