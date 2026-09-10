package com.missioncontrol.mission.service;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.missioncontrol.mission.entity.Mission;
import com.missioncontrol.mission.entity.MissionStatus;
import com.missioncontrol.mission.entity.MissionType;
import com.missioncontrol.mission.exception.InvalidMissionAssignmentException;
import com.missioncontrol.mission.repository.MissionRepository;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.entity.VehicleType;
import com.missioncontrol.vehicle.service.VehicleService;

@ExtendWith(MockitoExtension.class)
class MissionServiceTest {

    @Mock
    private MissionRepository missionRepository;

    @Mock
    private VehicleService vehicleService;

    @InjectMocks
    private MissionService missionService;

    @Test
    void shouldAssignActiveVehicleWhenVehicleIsNotInUse() {

        Mission mission = new Mission(
                "Test Mission",
                MissionType.PATROL
        );

        Vehicle vehicle = new Vehicle(
                "UAV-001",
                VehicleType.UAV,
                VehicleStatus.ACTIVE
        );

        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(mission));

        when(vehicleService.getVehicleById(1L))
                .thenReturn(vehicle);

        when(missionRepository
                .existsByVehicle_IdAndStatusInAndIdNot(
                        eq(1L),
                        anyCollection(),
                        eq(1L)))
                .thenReturn(false);

        when(missionRepository.save(any(Mission.class)))
                .thenReturn(mission);

        Mission result = missionService.assignVehicle(
                1L,
                1L
        );

        assertEquals(VehicleStatus.ACTIVE, result.getVehicle().getStatus());
        assertEquals(MissionStatus.READY, result.getStatus());

        verify(missionRepository).save(mission);
    }

    @Test
    void shouldRejectVehicleWhenVehicleIsAlreadyInUse() {

        Mission mission = new Mission(
                "Test Mission",
                MissionType.PATROL
        );

        Vehicle vehicle = new Vehicle(
                "UAV-001",
                VehicleType.UAV,
                VehicleStatus.ACTIVE
        );

        when(missionRepository.findById(2L))
                .thenReturn(Optional.of(mission));

        when(vehicleService.getVehicleById(1L))
                .thenReturn(vehicle);

        when(missionRepository
                .existsByVehicle_IdAndStatusInAndIdNot(
                        eq(1L),
                        anyCollection(),
                        eq(2L)))
                .thenReturn(true);

        assertThrows(
                InvalidMissionAssignmentException.class,
                () -> missionService.assignVehicle(
                        2L,
                        1L
                )
        );

        verify(missionRepository, never())
                .save(any(Mission.class));
    }

    @Test
    void shouldRejectVehicleWhenVehicleIsNotActive() {

        Mission mission = new Mission(
                "Test Mission",
                MissionType.PATROL
        );

        Vehicle vehicle = new Vehicle(
                "UAV-002",
                VehicleType.UAV,
                VehicleStatus.MAINTENANCE
        );

        when(missionRepository.findById(1L))
                .thenReturn(Optional.of(mission));

        when(vehicleService.getVehicleById(2L))
                .thenReturn(vehicle);

        assertThrows(
                InvalidMissionAssignmentException.class,
                () -> missionService.assignVehicle(
                        1L,
                        2L
                )
        );

        verify(missionRepository, never())
                .save(any(Mission.class));
    }
}