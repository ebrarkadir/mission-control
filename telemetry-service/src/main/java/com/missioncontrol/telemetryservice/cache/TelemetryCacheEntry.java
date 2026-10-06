package com.missioncontrol.telemetryservice.cache;

import java.time.Instant;

import com.missioncontrol.telemetryservice.entity.TelemetryRecord;

public record TelemetryCacheEntry(
        Long id,
        Long vehicleId,
        double latitude,
        double longitude,
        double altitude,
        double speed,
        int battery,
        double temperature,
        Instant recordedAt,
        Instant createdAt) {

    public static TelemetryCacheEntry from(
            TelemetryRecord telemetry) {

        return new TelemetryCacheEntry(
                telemetry.getId(),
                telemetry.getVehicleId(),
                telemetry.getLatitude(),
                telemetry.getLongitude(),
                telemetry.getAltitude(),
                telemetry.getSpeed(),
                telemetry.getBattery(),
                telemetry.getTemperature(),
                telemetry.getRecordedAt(),
                telemetry.getCreatedAt()
        );
    }

    public TelemetryRecord toTelemetryRecord() {

        return TelemetryRecord.restore(
                id,
                vehicleId,
                latitude,
                longitude,
                altitude,
                speed,
                battery,
                temperature,
                recordedAt,
                createdAt
        );
    }
}