package com.missioncontrol.mission.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.mission.dto.CreateMissionRequest;
import com.missioncontrol.mission.dto.MissionResponse;
import com.missioncontrol.mission.entity.Mission;
import com.missioncontrol.mission.service.MissionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/missions")
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MissionResponse createMission(
            @Valid @RequestBody CreateMissionRequest request) {

        Mission mission = missionService.createMission(
                request.name(),
                request.type()
        );

        return toResponse(mission);
    }

    private MissionResponse toResponse(Mission mission) {

        Long vehicleId = mission.getVehicle() != null
                ? mission.getVehicle().getId()
                : null;

        return new MissionResponse(
                mission.getId(),
                mission.getName(),
                mission.getType(),
                mission.getStatus(),
                vehicleId,
                mission.getStartedAt(),
                mission.getCompletedAt(),
                mission.getCreatedAt(),
                mission.getUpdatedAt()
        );
    }
}