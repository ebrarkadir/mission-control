package com.missioncontrol.telemetryservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.telemetryservice.entity.TelemetryRecord;

public interface TelemetryRepository
        extends JpaRepository<TelemetryRecord, Long> {

    Optional<TelemetryRecord> findTopByVehicleIdOrderByRecordedAtDesc(
            Long vehicleId
    );

    List<TelemetryRecord> findTop100ByVehicleIdOrderByRecordedAtDesc(
            Long vehicleId
    );
}