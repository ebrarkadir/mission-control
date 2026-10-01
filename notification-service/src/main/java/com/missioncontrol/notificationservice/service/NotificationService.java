package com.missioncontrol.notificationservice.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.notificationservice.entity.Notification;
import com.missioncontrol.notificationservice.messaging.AlertCreatedEvent;
import com.missioncontrol.notificationservice.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }

    public void createFromAlert(AlertCreatedEvent event) {

        boolean alreadyExists =
                notificationRepository.existsByAlertId(
                        event.alertId()
                );

        if (alreadyExists) {
            return;
        }

        Notification notification =
                new Notification(
                        event.alertId(),
                        event.vehicleId(),
                        event.type(),
                        event.severity(),
                        event.message()
                );

        notificationRepository.save(notification);
    }

    public List<Notification> getVehicleNotifications(
            Long vehicleId) {

        return notificationRepository
                .findByVehicleIdOrderByCreatedAtDesc(vehicleId);
    }
}