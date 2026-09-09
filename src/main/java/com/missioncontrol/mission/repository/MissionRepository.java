package com.missioncontrol.mission.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.mission.entity.Mission;

public interface MissionRepository extends JpaRepository<Mission, Long> {
}