package com.missioncontrol.alertservice.scheduler;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.missioncontrol.alertservice.client.TelemetryClient;
import com.missioncontrol.alertservice.client.VehicleClient;
import com.missioncontrol.alertservice.service.AlertService;

@Component
public class ConnectionLostMonitor {

    private static final Logger log =
            LoggerFactory.getLogger(ConnectionLostMonitor.class);

    private static final long CONNECTION_TIMEOUT_SECONDS = 10;

    private final VehicleClient vehicleClient;
    private final TelemetryClient telemetryClient;
    private final AlertService alertService;

    public ConnectionLostMonitor(
            VehicleClient vehicleClient,
            TelemetryClient telemetryClient,
            AlertService alertService) {

        this.vehicleClient = vehicleClient;
        this.telemetryClient = telemetryClient;
        this.alertService = alertService;
    }

    @Scheduled(fixedRate = 5000)
    public void checkConnections() {

        List<Long> activeVehicleIds;

        try {
            activeVehicleIds =
                    vehicleClient.getActiveVehicleIds();

        } catch (Exception exception) {

            log.warn(
                    "Could not retrieve active vehicles",
                    exception
            );

            return;
        }

        for (Long vehicleId : activeVehicleIds) {
            checkVehicleConnection(vehicleId);
        }
    }

    private void checkVehicleConnection(Long vehicleId) {

        try {
            telemetryClient
                    .getLatestReceivedAt(vehicleId)
                    .ifPresent(receivedAt -> {

                        Duration elapsed =
                                Duration.between(
                                        receivedAt,
                                        Instant.now()
                                );

                        if (elapsed.getSeconds()
                                >= CONNECTION_TIMEOUT_SECONDS) {

                            alertService
                                    .createConnectionLostAlertIfNotOpen(
                                            vehicleId
                                    );
                        }
                    });

        } catch (Exception exception) {

            log.warn(
                    "Could not check telemetry connection for vehicle {}",
                    vehicleId,
                    exception
            );
        }
    }
}