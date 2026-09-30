package com.missioncontrol.telemetryservice.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.telemetryservice.client.VehicleClient;
import com.missioncontrol.telemetryservice.entity.TelemetryRecord;
import com.missioncontrol.telemetryservice.exception.TelemetryNotFoundException;
import com.missioncontrol.telemetryservice.repository.TelemetryRepository;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final VehicleClient vehicleClient;
    private final TelemetryStreamService telemetryStreamService;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            VehicleClient vehicleClient,
            TelemetryStreamService telemetryStreamService) {

        this.telemetryRepository = telemetryRepository;
        this.vehicleClient = vehicleClient;
        this.telemetryStreamService = telemetryStreamService;
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

        vehicleClient.validateVehicleExists(vehicleId);

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

        TelemetryRecord savedTelemetry =
                telemetryRepository.save(telemetry);

        telemetryStreamService.publish(savedTelemetry);

        return savedTelemetry;
    }

    public TelemetryRecord getLatestTelemetry(Long vehicleId) {

        vehicleClient.validateVehicleExists(vehicleId);

        return telemetryRepository
                .findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() ->
                        new TelemetryNotFoundException(vehicleId)
                );
    }

    public List<TelemetryRecord> getTelemetryHistory(Long vehicleId) {

        vehicleClient.validateVehicleExists(vehicleId);

        return telemetryRepository
                .findTop100ByVehicleIdOrderByRecordedAtDesc(vehicleId);
    }

    public void validateVehicleExists(Long vehicleId) {
        vehicleClient.validateVehicleExists(vehicleId);
    }
}