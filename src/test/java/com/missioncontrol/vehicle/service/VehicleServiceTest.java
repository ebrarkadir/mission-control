package com.missioncontrol.vehicle.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;
import com.missioncontrol.vehicle.exception.DuplicateVehicleNameException;
import com.missioncontrol.vehicle.exception.VehicleNotFoundException;
import com.missioncontrol.vehicle.repository.VehicleRepository;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private VehicleService vehicleService;

    @Test
    void shouldCreateVehicle() {

        when(vehicleRepository.existsByName("UAV-002"))
                .thenReturn(false);

        Vehicle vehicle = new Vehicle(
                "UAV-002",
                VehicleType.UAV,
                VehicleStatus.ACTIVE
        );

        when(vehicleRepository.save(
                org.mockito.ArgumentMatchers.any(Vehicle.class)))
                .thenReturn(vehicle);

        Vehicle result = vehicleService.createVehicle(
                "UAV-002",
                VehicleType.UAV,
                VehicleStatus.ACTIVE
        );

        assertEquals("UAV-002", result.getName());

        verify(vehicleRepository).save(
                org.mockito.ArgumentMatchers.any(Vehicle.class));
    }

    @Test
    void shouldThrowWhenVehicleNameAlreadyExists() {

        when(vehicleRepository.existsByName("UAV-001"))
                .thenReturn(true);

        assertThrows(
                DuplicateVehicleNameException.class,
                () -> vehicleService.createVehicle(
                        "UAV-001",
                        VehicleType.UAV,
                        VehicleStatus.ACTIVE
                )
        );

        verify(vehicleRepository, never())
                .save(org.mockito.ArgumentMatchers.any(Vehicle.class));
    }

    @Test
    void shouldThrowWhenVehicleDoesNotExist() {

        when(vehicleRepository.findById(999L))
                .thenReturn(Optional.empty());

        assertThrows(
                VehicleNotFoundException.class,
                () -> vehicleService.getVehicleById(999L)
        );
    }
}