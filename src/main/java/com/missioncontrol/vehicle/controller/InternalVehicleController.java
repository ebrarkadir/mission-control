package com.missioncontrol.vehicle.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.missioncontrol.vehicle.service.VehicleService;

@RestController
@RequestMapping("/api/internal/vehicles")
public class InternalVehicleController {

    private final VehicleService vehicleService;
    private final String internalApiKey;

    public InternalVehicleController(
            VehicleService vehicleService,
            @Value("${app.internal-api-key}") String internalApiKey) {

        this.vehicleService = vehicleService;
        this.internalApiKey = internalApiKey;
    }

    @GetMapping("/{vehicleId}/exists")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void validateVehicleExists(
            @PathVariable Long vehicleId,
            @RequestHeader(
                    value = "X-Internal-Api-Key",
                    required = false
            ) String apiKey) {

        if (!internalApiKey.equals(apiKey)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid internal API key"
            );
        }

        vehicleService.getVehicleById(vehicleId);
    }
}