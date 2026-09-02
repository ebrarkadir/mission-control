package com.missioncontrol.vehicle.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.bind.annotation.PutMapping;

import com.missioncontrol.vehicle.dto.CreateVehicleRequest;
import com.missioncontrol.vehicle.dto.UpdateVehicleRequest;
import com.missioncontrol.vehicle.dto.UpdateVehicleStatusRequest;
import com.missioncontrol.vehicle.dto.VehicleResponse;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.service.VehicleService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VehicleResponse createVehicle(
            @Valid @RequestBody CreateVehicleRequest request) {

        Vehicle vehicle = vehicleService.createVehicle(
                request.name(),
                request.type(),
                request.status());

        return toResponse(vehicle);
    }

    @GetMapping("/{id}")
    public VehicleResponse getVehicleById(
            @PathVariable Long id) {

        Vehicle vehicle = vehicleService.getVehicleById(id);

        return toResponse(vehicle);
    }

    @GetMapping
    public List<VehicleResponse> getAllVehicles() {

        return vehicleService.getAllVehicles()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PutMapping("/{id}")
    public VehicleResponse updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVehicleRequest request) {

        Vehicle vehicle = vehicleService.updateVehicle(
                id,
                request.name(),
                request.type(),
                request.status());

        return toResponse(vehicle);
    }

    @PatchMapping("/{id}/status")
    public VehicleResponse updateVehicleStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVehicleStatusRequest request) {

        Vehicle vehicle = vehicleService.updateVehicleStatus(
                id,
                request.status());

        return toResponse(vehicle);
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getName(),
                vehicle.getType(),
                vehicle.getStatus(),
                vehicle.getCreatedAt(),
                vehicle.getUpdatedAt());
    }
}