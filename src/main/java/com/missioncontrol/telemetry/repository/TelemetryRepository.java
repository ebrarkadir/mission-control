package com.missioncontrol.telemetry.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.telemetry.entity.TelemetryRecord;

public interface TelemetryRepository extends JpaRepository<TelemetryRecord, Long> {

    Optional<TelemetryRecord> findTopByVehicle_IdOrderByRecordedAtDesc(
            Long vehicleId
    );

    List<TelemetryRecord> findTop100ByVehicle_IdOrderByRecordedAtDesc(
            Long vehicleId
    );
}