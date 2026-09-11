package com.missioncontrol.telemetry.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.telemetry.dto.CreateTelemetryRequest;
import com.missioncontrol.telemetry.dto.TelemetryResponse;
import com.missioncontrol.telemetry.entity.TelemetryRecord;
import com.missioncontrol.telemetry.service.TelemetryService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TelemetryResponse createTelemetry(
            @PathVariable Long vehicleId,
            @Valid @RequestBody CreateTelemetryRequest request) {

        TelemetryRecord telemetry = telemetryService.createTelemetry(
                vehicleId,
                request.latitude(),
                request.longitude(),
                request.altitude(),
                request.speed(),
                request.battery(),
                request.temperature(),
                request.recordedAt()
        );

        return toResponse(telemetry);
    }

    @GetMapping("/latest")
    public TelemetryResponse getLatestTelemetry(
            @PathVariable Long vehicleId) {

        TelemetryRecord telemetry =
                telemetryService.getLatestTelemetry(vehicleId);

        return toResponse(telemetry);
    }

    @GetMapping
    public List<TelemetryResponse> getTelemetryHistory(
            @PathVariable Long vehicleId) {

        return telemetryService.getTelemetryHistory(vehicleId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TelemetryResponse toResponse(TelemetryRecord telemetry) {

        return new TelemetryResponse(
                telemetry.getId(),
                telemetry.getVehicle().getId(),
                telemetry.getLatitude(),
                telemetry.getLongitude(),
                telemetry.getAltitude(),
                telemetry.getSpeed(),
                telemetry.getBattery(),
                telemetry.getTemperature(),
                telemetry.getRecordedAt(),
                telemetry.getCreatedAt()
        );
    }
}