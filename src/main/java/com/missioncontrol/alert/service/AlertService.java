package com.missioncontrol.alert.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.alert.entity.Alert;
import com.missioncontrol.alert.entity.AlertSeverity;
import com.missioncontrol.alert.entity.AlertStatus;
import com.missioncontrol.alert.entity.AlertType;
import com.missioncontrol.alert.repository.AlertRepository;
import com.missioncontrol.telemetry.entity.TelemetryRecord;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.service.VehicleService;

@Service
public class AlertService {

    private static final int LOW_BATTERY_THRESHOLD = 20;
    private static final double HIGH_TEMPERATURE_THRESHOLD = 70.0;

    private final AlertRepository alertRepository;
    private final VehicleService vehicleService;

    public AlertService(
            AlertRepository alertRepository,
            VehicleService vehicleService) {

        this.alertRepository = alertRepository;
        this.vehicleService = vehicleService;
    }

    public void evaluateTelemetry(TelemetryRecord telemetry) {

        Long vehicleId = telemetry.getVehicle().getId();

        resolveAlertIfOpen(
                vehicleId,
                AlertType.CONNECTION_LOST
        );

        if (telemetry.getBattery() < LOW_BATTERY_THRESHOLD) {
            createAlertIfNotOpen(
                    telemetry,
                    AlertType.LOW_BATTERY,
                    AlertSeverity.WARNING,
                    "Vehicle battery is below 20%"
            );
        } else {
            resolveAlertIfOpen(
                    vehicleId,
                    AlertType.LOW_BATTERY
            );
        }

        if (telemetry.getTemperature() > HIGH_TEMPERATURE_THRESHOLD) {
            createAlertIfNotOpen(
                    telemetry,
                    AlertType.HIGH_TEMPERATURE,
                    AlertSeverity.CRITICAL,
                    "Vehicle temperature is above 70 degrees"
            );
        } else {
            resolveAlertIfOpen(
                    vehicleId,
                    AlertType.HIGH_TEMPERATURE
            );
        }
    }

    public void createConnectionLostAlertIfNotOpen(Vehicle vehicle) {

        Long vehicleId = vehicle.getId();

        boolean openAlertExists =
                alertRepository.existsByVehicle_IdAndTypeAndStatus(
                        vehicleId,
                        AlertType.CONNECTION_LOST,
                        AlertStatus.OPEN
                );

        if (openAlertExists) {
            return;
        }

        Alert alert = new Alert(
                vehicle,
                null,
                AlertType.CONNECTION_LOST,
                AlertSeverity.CRITICAL,
                "Vehicle telemetry connection lost"
        );

        alertRepository.save(alert);
    }

    public List<Alert> getVehicleAlerts(Long vehicleId) {

        vehicleService.getVehicleById(vehicleId);

        return alertRepository
                .findByVehicle_IdOrderByCreatedAtDesc(vehicleId);
    }

    private void createAlertIfNotOpen(
            TelemetryRecord telemetry,
            AlertType type,
            AlertSeverity severity,
            String message) {

        Long vehicleId = telemetry.getVehicle().getId();

        boolean openAlertExists =
                alertRepository.existsByVehicle_IdAndTypeAndStatus(
                        vehicleId,
                        type,
                        AlertStatus.OPEN
                );

        if (openAlertExists) {
            return;
        }

        Alert alert = new Alert(
                telemetry.getVehicle(),
                telemetry,
                type,
                severity,
                message
        );

        alertRepository.save(alert);
    }

    private void resolveAlertIfOpen(
            Long vehicleId,
            AlertType type) {

        alertRepository
                .findByVehicle_IdAndTypeAndStatus(
                        vehicleId,
                        type,
                        AlertStatus.OPEN
                )
                .ifPresent(alert -> {
                    alert.resolve();
                    alertRepository.save(alert);
                });
    }
}