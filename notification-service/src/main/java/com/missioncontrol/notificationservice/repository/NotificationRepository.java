package com.missioncontrol.notificationservice.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.notificationservice.entity.Notification;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    boolean existsByUserIdAndAlertId(
            Long userId,
            Long alertId
    );

    List<Notification> findByUserIdOrderByCreatedAtDesc(
            Long userId
    );

    Optional<Notification> findByIdAndUserId(
            Long notificationId,
            Long userId
    );

    long countByUserIdAndReadFalse(
            Long userId
    );

    List<Notification> findByVehicleIdOrderByCreatedAtDesc(
            Long vehicleId
    );
}