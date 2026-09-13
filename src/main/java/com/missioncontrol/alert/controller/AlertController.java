package com.missioncontrol.alert.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.alert.dto.AlertResponse;
import com.missioncontrol.alert.entity.Alert;
import com.missioncontrol.alert.service.AlertService;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<AlertResponse> getVehicleAlerts(
            @PathVariable Long vehicleId) {

        return alertService.getVehicleAlerts(vehicleId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AlertResponse toResponse(Alert alert) {

        Long telemetryRecordId =
                alert.getTelemetryRecord() != null
                        ? alert.getTelemetryRecord().getId()
                        : null;

        return new AlertResponse(
                alert.getId(),
                alert.getVehicle().getId(),
                telemetryRecordId,
                alert.getType(),
                alert.getSeverity(),
                alert.getMessage(),
                alert.getStatus(),
                alert.getCreatedAt(),
                alert.getResolvedAt()
        );
    }
}