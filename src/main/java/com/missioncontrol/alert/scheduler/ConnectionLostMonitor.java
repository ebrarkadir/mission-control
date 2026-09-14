package com.missioncontrol.alert.scheduler;

import java.time.Duration;
import java.time.Instant;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.missioncontrol.alert.service.AlertService;
import com.missioncontrol.telemetry.repository.TelemetryRepository;
import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.service.VehicleService;

@Component
public class ConnectionLostMonitor {

    private static final long CONNECTION_TIMEOUT_SECONDS = 10;

    private final VehicleService vehicleService;
    private final TelemetryRepository telemetryRepository;
    private final AlertService alertService;

    public ConnectionLostMonitor(
            VehicleService vehicleService,
            TelemetryRepository telemetryRepository,
            AlertService alertService) {

        this.vehicleService = vehicleService;
        this.telemetryRepository = telemetryRepository;
        this.alertService = alertService;
    }

    @Scheduled(fixedRate = 5000)
    public void checkConnections() {

        vehicleService.getAllVehicles()
                .stream()
                .filter(vehicle ->
                        vehicle.getStatus() == VehicleStatus.ACTIVE)
                .forEach(vehicle ->
                        telemetryRepository
                                .findTopByVehicle_IdOrderByRecordedAtDesc(
                                        vehicle.getId()
                                )
                                .ifPresent(latestTelemetry -> {

                                    Duration elapsed =
                                            Duration.between(
                                                latestTelemetry.getRecordedAt(),
                                                Instant.now()
                                            );

                                    if (elapsed.getSeconds()
                                            >= CONNECTION_TIMEOUT_SECONDS) {

                                        alertService
                                            .createConnectionLostAlertIfNotOpen(
                                                vehicle
                                            );
                                    }
                                })
                );
    }
}