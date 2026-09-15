package com.missioncontrol.telemetryservice.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.telemetryservice.entity.TelemetryRecord;
import com.missioncontrol.telemetryservice.exception.TelemetryNotFoundException;
import com.missioncontrol.telemetryservice.repository.TelemetryRepository;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;

    public TelemetryService(
            TelemetryRepository telemetryRepository) {

        this.telemetryRepository = telemetryRepository;
    }

    public TelemetryRecord createTelemetry(
            Long vehicleId,
            double latitude,
            double longitude,
            double altitude,
            double speed,
            int battery,
            double temperature,
            Instant recordedAt) {

        TelemetryRecord telemetry = new TelemetryRecord(
                vehicleId,
                latitude,
                longitude,
                altitude,
                speed,
                battery,
                temperature,
                recordedAt
        );

        return telemetryRepository.save(telemetry);
    }

    public TelemetryRecord getLatestTelemetry(Long vehicleId) {

        return telemetryRepository
                .findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() ->
                        new TelemetryNotFoundException(vehicleId)
                );
    }

    public List<TelemetryRecord> getTelemetryHistory(Long vehicleId) {

        return telemetryRepository
                .findTop100ByVehicleIdOrderByRecordedAtDesc(vehicleId);
    }
}