package com.missioncontrol.mission.repository;

import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.mission.entity.Mission;
import com.missioncontrol.mission.entity.MissionStatus;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    boolean existsByVehicle_IdAndStatusInAndIdNot(
            Long vehicleId,
            Collection<MissionStatus> statuses,
            Long missionId
    );
}