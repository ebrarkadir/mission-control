package com.missioncontrol.telemetry.simulator;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.missioncontrol.telemetry.service.TelemetryService;

@Component
public class TelemetrySimulator {

    private static final Long VEHICLE_ID = 1L;

    private final TelemetryService telemetryService;

    private double latitude = 39.9255;
    private double longitude = 32.8663;
    private double altitude = 1200.0;
    private double speed = 80.0;
    private int battery = 100;
    private double temperature = 38.0;

    public TelemetrySimulator(TelemetryService telemetryService) {
        System.out.println("### TELEMETRY SIMULATOR BEAN OLUSTU ###");
        this.telemetryService = telemetryService;
    }

    @Scheduled(fixedRate = 1000)
    public void generateTelemetry() {

        System.out.println("Telemetry simulator çalıştı");

        latitude += randomBetween(-0.0005, 0.0005);
        longitude += randomBetween(-0.0005, 0.0005);

        altitude = Math.max(
                0,
                altitude + randomBetween(-15.0, 15.0)
        );

        speed = Math.max(
                0,
                speed + randomBetween(-5.0, 5.0)
        );

        temperature += randomBetween(-0.5, 0.8);

        if (battery > 0) {
            battery--;
        }

        telemetryService.createTelemetry(
                VEHICLE_ID,
                latitude,
                longitude,
                altitude,
                speed,
                battery,
                temperature,
                Instant.now()
        );
    }

    private double randomBetween(
            double min,
            double max) {

        return ThreadLocalRandom.current()
                .nextDouble(min, max);
    }
}
