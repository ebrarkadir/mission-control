package com.missioncontrol.vehicle.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;
import com.missioncontrol.vehicle.repository.VehicleRepository;
import com.missioncontrol.vehicle.exception.VehicleNotFoundException;
import com.missioncontrol.vehicle.exception.DuplicateVehicleNameException;

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

        if (vehicleRepository.existsByName(name)) {
            throw new DuplicateVehicleNameException(name);
        }

        Vehicle vehicle = new Vehicle(
                name,
                type,
                status);

        return vehicleRepository.save(vehicle);
    }

    public Vehicle getVehicleById(Long id) {
        return vehicleRepository
                .findById(id)
                .orElseThrow(() -> new VehicleNotFoundException(id));
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle updateVehicle(
            Long id,
            String name,
            VehicleType type,
            VehicleStatus status) {

        Vehicle vehicle = getVehicleById(id);

        if (vehicleRepository.existsByNameAndIdNot(name, id)) {
            throw new DuplicateVehicleNameException(name);
        }

        vehicle.updateDetails(name, type, status);

        return vehicleRepository.save(vehicle);
    }

    public Vehicle updateVehicleStatus(Long id, VehicleStatus status) {
        Vehicle vehicle = getVehicleById(id);
        vehicle.changeStatus(status);
        return vehicleRepository.save(vehicle);
    }


}