package com.missioncontrol.vehicle.service;

import org.springframework.stereotype.Service;

import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;
import com.missioncontrol.vehicle.repository.VehicleRepository;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public Vehicle createVehicle(
            String name,
            VehicleType type,
            VehicleStatus status) {

        Vehicle vehicle = new Vehicle(
                name,
                type,
                status
        );

        return vehicleRepository.save(vehicle);
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository
                .findById(id)
                .orElseThrow();
    }
}