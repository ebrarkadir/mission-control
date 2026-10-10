package com.missioncontrol.telemetryservice.simulator;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import com.missioncontrol.telemetryservice.service.TelemetryService;

@Configuration
@EnableScheduling
@ConditionalOnProperty(
        name = "app.telemetry-simulator.enabled",
        havingValue = "true"
)
public class TelemetrySimulator {

    private static final Logger log =
            LoggerFactory.getLogger(TelemetrySimulator.class);

    private final TelemetryService telemetryService;
    private final Long vehicleId;

    private long tick = 0;

    public TelemetrySimulator(
            TelemetryService telemetryService,
            @Value("${app.telemetry-simulator.vehicle-id:1}") Long vehicleId) {

        this.telemetryService = telemetryService;
        this.vehicleId = vehicleId;
    }

    @Scheduled(
            fixedRateString = "${app.telemetry-simulator.interval-ms:2000}",
            initialDelayString = "${app.telemetry-simulator.initial-delay-ms:5000}"
    )
    public void generateTelemetry() {

        try {
            long currentTick = tick++;

            double latitude =
                    39.9334 + Math.sin(currentTick / 10.0) * 0.0015;

            double longitude =
                    32.8597 + Math.cos(currentTick / 10.0) * 0.0015;

            double altitude =
                    1200.0 + Math.sin(currentTick / 5.0) * 25.0;

            double speed =
                    75.0 + Math.sin(currentTick / 4.0) * 15.0;

            int battery =
                    95 - (int) (currentTick % 70);

            double temperature =
                    42.0 + Math.sin(currentTick / 3.0) * 6.0;

            telemetryService.createTelemetry(
                    vehicleId,
                    latitude,
                    longitude,
                    altitude,
                    speed,
                    battery,
                    temperature,
                    Instant.now()
            );

            log.info(
                    "Simulated telemetry generated for vehicleId={} tick={}",
                    vehicleId,
                    currentTick
            );

        } catch (Exception exception) {
            log.warn(
                    "Telemetry simulator could not generate telemetry for vehicleId={}: {}",
                    vehicleId,
                    exception.getMessage()
            );
        }
    }
}