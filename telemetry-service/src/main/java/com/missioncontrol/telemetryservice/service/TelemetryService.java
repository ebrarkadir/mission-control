package com.missioncontrol.telemetryservice.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.missioncontrol.telemetryservice.cache.TelemetryCacheEntry;
import com.missioncontrol.telemetryservice.cache.TelemetryCacheService;
import com.missioncontrol.telemetryservice.client.VehicleClient;
import com.missioncontrol.telemetryservice.entity.TelemetryRecord;
import com.missioncontrol.telemetryservice.exception.TelemetryNotFoundException;
import com.missioncontrol.telemetryservice.messaging.TelemetryEventPublisher;
import com.missioncontrol.telemetryservice.repository.TelemetryRepository;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final VehicleClient vehicleClient;
    private final TelemetryStreamService telemetryStreamService;
    private final TelemetryEventPublisher telemetryEventPublisher;
    private final TelemetryCacheService telemetryCacheService;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            VehicleClient vehicleClient,
            TelemetryStreamService telemetryStreamService,
            TelemetryEventPublisher telemetryEventPublisher,
            TelemetryCacheService telemetryCacheService) {

        this.telemetryRepository = telemetryRepository;
        this.vehicleClient = vehicleClient;
        this.telemetryStreamService = telemetryStreamService;
        this.telemetryEventPublisher = telemetryEventPublisher;
        this.telemetryCacheService = telemetryCacheService;
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

        telemetryCacheService.evictLatest(vehicleId);

        telemetryStreamService.publish(savedTelemetry);

        telemetryEventPublisher.publishTelemetryCreated(
                savedTelemetry
        );

        return savedTelemetry;
    }

    public TelemetryRecord getLatestTelemetry(Long vehicleId) {

        vehicleClient.validateVehicleExists(vehicleId);

        Optional<TelemetryCacheEntry> cachedTelemetry =
                telemetryCacheService.getLatest(vehicleId);

        if (cachedTelemetry.isPresent()) {
            return cachedTelemetry
                    .get()
                    .toTelemetryRecord();
        }

        TelemetryRecord telemetry =
                telemetryRepository
                        .findTopByVehicleIdOrderByRecordedAtDesc(vehicleId)
                        .orElseThrow(() ->
                                new TelemetryNotFoundException(vehicleId)
                        );

        telemetryCacheService.putLatest(telemetry);

        return telemetry;
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