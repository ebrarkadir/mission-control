package com.missioncontrol.mission.service;

import org.springframework.stereotype.Service;

import com.missioncontrol.mission.entity.Mission;
import com.missioncontrol.mission.entity.MissionType;
import com.missioncontrol.mission.repository.MissionRepository;

@Service
public class MissionService {

    private final MissionRepository missionRepository;

    public MissionService(MissionRepository missionRepository) {
        this.missionRepository = missionRepository;
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
}