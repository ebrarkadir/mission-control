package com.missioncontrol.notification.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.notification.entity.Notification;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_IdOrderByCreatedAtDesc(
            Long userId
    );

    Optional<Notification> findByIdAndUser_Id(
            Long notificationId,
            Long userId
    );

    long countByUser_IdAndReadAtIsNull(
            Long userId
    );
}