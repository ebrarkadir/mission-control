package com.missioncontrol.notificationservice.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.notificationservice.entity.Notification;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    boolean existsByAlertId(Long alertId);

    List<Notification> findByVehicleIdOrderByCreatedAtDesc(
            Long vehicleId);
}