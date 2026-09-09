package com.missioncontrol.mission.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.mission.entity.Mission;
import com.missioncontrol.mission.entity.MissionStatus;
import com.missioncontrol.mission.entity.MissionType;
import com.missioncontrol.mission.exception.InvalidMissionAssignmentException;
import com.missioncontrol.mission.exception.MissionNotFoundException;
import com.missioncontrol.mission.repository.MissionRepository;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.entity.VehicleStatus;
import com.missioncontrol.vehicle.service.VehicleService;

@Service
public class MissionService {

    private final MissionRepository missionRepository;
    private final VehicleService vehicleService;

    public MissionService(
            MissionRepository missionRepository,
            VehicleService vehicleService) {

        this.missionRepository = missionRepository;
        this.vehicleService = vehicleService;
    }

    public Mission createMission(
            String name,
            MissionType type) {

        Mission mission = new Mission(
                name,
                type
        );

        return missionRepository.save(mission);
    }

    public Mission getMissionById(Long id) {
        return missionRepository
                .findById(id)
                .orElseThrow(() -> new MissionNotFoundException(id));
    }

    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    public Mission assignVehicle(
            Long missionId,
            Long vehicleId) {

        Mission mission = getMissionById(missionId);
        Vehicle vehicle = vehicleService.getVehicleById(vehicleId);

        if (mission.getStatus() != MissionStatus.PLANNED
                && mission.getStatus() != MissionStatus.READY) {

            throw new InvalidMissionAssignmentException(
                    "Vehicle cannot be assigned to mission with status: "
                            + mission.getStatus()
            );
        }

        if (vehicle.getStatus() != VehicleStatus.ACTIVE) {
            throw new InvalidMissionAssignmentException(
                    "Only ACTIVE vehicles can be assigned to missions"
            );
        }

        mission.assignVehicle(vehicle);

        return missionRepository.save(mission);
    }
}