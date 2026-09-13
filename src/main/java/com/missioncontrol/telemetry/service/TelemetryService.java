package com.missioncontrol.telemetry.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.telemetry.entity.TelemetryRecord;
import com.missioncontrol.telemetry.exception.TelemetryNotFoundException;
import com.missioncontrol.telemetry.repository.TelemetryRepository;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.service.VehicleService;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final VehicleService vehicleService;
    private final TelemetryStreamService telemetryStreamService;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            VehicleService vehicleService,
            TelemetryStreamService telemetryStreamService) {

        this.telemetryRepository = telemetryRepository;
        this.vehicleService = vehicleService;
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

        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);

        TelemetryRecord telemetry = new TelemetryRecord(
                vehicle,
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

        vehicleService.getVehicleById(vehicleId);

        return telemetryRepository
                .findTopByVehicle_IdOrderByRecordedAtDesc(vehicleId)
                .orElseThrow(() ->
                        new TelemetryNotFoundException(vehicleId)
                );
    }

    public List<TelemetryRecord> getTelemetryHistory(Long vehicleId) {

        vehicleService.getVehicleById(vehicleId);

        return telemetryRepository
                .findTop100ByVehicle_IdOrderByRecordedAtDesc(vehicleId);
    }
}