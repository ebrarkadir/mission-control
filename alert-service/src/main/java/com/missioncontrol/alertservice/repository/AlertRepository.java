package com.missioncontrol.alertservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.alertservice.entity.Alert;
import com.missioncontrol.alertservice.entity.AlertStatus;
import com.missioncontrol.alertservice.entity.AlertType;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    boolean existsByVehicleIdAndTypeAndStatus(
            Long vehicleId,
            AlertType type,
            AlertStatus status
    );

    Optional<Alert> findByVehicleIdAndTypeAndStatus(
            Long vehicleId,
            AlertType type,
            AlertStatus status
    );

    List<Alert> findByVehicleIdOrderByCreatedAtDesc(
            Long vehicleId
    );
}