package com.missioncontrol.alertservice.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.alertservice.dto.TelemetryData;
import com.missioncontrol.alertservice.entity.Alert;
import com.missioncontrol.alertservice.entity.AlertSeverity;
import com.missioncontrol.alertservice.entity.AlertStatus;
import com.missioncontrol.alertservice.entity.AlertType;
import com.missioncontrol.alertservice.messaging.AlertEventPublisher;
import com.missioncontrol.alertservice.repository.AlertRepository;

@Service
public class AlertService {

    private static final int LOW_BATTERY_THRESHOLD = 20;
    private static final double HIGH_TEMPERATURE_THRESHOLD = 70.0;

    private final AlertRepository alertRepository;
    private final AlertEventPublisher alertEventPublisher;

    public AlertService(
            AlertRepository alertRepository,
            AlertEventPublisher alertEventPublisher) {

        this.alertRepository = alertRepository;
        this.alertEventPublisher = alertEventPublisher;
    }

    public void evaluateTelemetry(TelemetryData telemetry) {
        Long vehicleId = telemetry.vehicleId();

        resolveAlertIfOpen(
                vehicleId,
                AlertType.CONNECTION_LOST
        );

        if (telemetry.battery() < LOW_BATTERY_THRESHOLD) {
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

        if (telemetry.temperature() >
                HIGH_TEMPERATURE_THRESHOLD) {

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

    public void createConnectionLostAlertIfNotOpen(
            Long vehicleId) {

        boolean openAlertExists =
                alertRepository.existsByVehicleIdAndTypeAndStatus(
                        vehicleId,
                        AlertType.CONNECTION_LOST,
                        AlertStatus.OPEN
                );

        if (openAlertExists) {
            return;
        }

        Alert alert = new Alert(
                vehicleId,
                null,
                AlertType.CONNECTION_LOST,
                AlertSeverity.CRITICAL,
                "Vehicle telemetry connection lost"
        );

        saveAndPublish(alert);
    }

    public List<Alert> getVehicleAlerts(Long vehicleId) {
        return alertRepository
                .findByVehicleIdOrderByCreatedAtDesc(vehicleId);
    }

    private void createAlertIfNotOpen(
            TelemetryData telemetry,
            AlertType type,
            AlertSeverity severity,
            String message) {

        Long vehicleId = telemetry.vehicleId();

        boolean openAlertExists =
                alertRepository.existsByVehicleIdAndTypeAndStatus(
                        vehicleId,
                        type,
                        AlertStatus.OPEN
                );

        if (openAlertExists) {
            return;
        }

        Alert alert = new Alert(
                vehicleId,
                telemetry.telemetryId(),
                type,
                severity,
                message
        );

        saveAndPublish(alert);
    }

    private void saveAndPublish(Alert alert) {

        Alert savedAlert =
                alertRepository.save(alert);

        alertEventPublisher
                .publishAlertCreated(savedAlert);
    }

    private void resolveAlertIfOpen(
            Long vehicleId,
            AlertType type) {

        alertRepository
                .findByVehicleIdAndTypeAndStatus(
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