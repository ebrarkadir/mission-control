package com.missioncontrol.alert.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.alert.entity.Alert;
import com.missioncontrol.alert.entity.AlertStatus;
import com.missioncontrol.alert.entity.AlertType;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    boolean existsByVehicle_IdAndTypeAndStatus(
            Long vehicleId,
            AlertType type,
            AlertStatus status
    );

    Optional<Alert> findByVehicle_IdAndTypeAndStatus(
            Long vehicleId,
            AlertType type,
            AlertStatus status
    );

    List<Alert> findByVehicle_IdOrderByCreatedAtDesc(
            Long vehicleId
    );
}