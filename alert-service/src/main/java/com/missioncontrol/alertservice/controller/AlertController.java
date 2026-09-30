package com.missioncontrol.alertservice.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.alertservice.dto.TelemetryData;
import com.missioncontrol.alertservice.entity.Alert;
import com.missioncontrol.alertservice.service.AlertService;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @PostMapping("/evaluate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void evaluateTelemetry(
            @RequestBody TelemetryData telemetry) {

        alertService.evaluateTelemetry(telemetry);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<Alert> getVehicleAlerts(
            @PathVariable Long vehicleId) {

        return alertService.getVehicleAlerts(vehicleId);
    }
}