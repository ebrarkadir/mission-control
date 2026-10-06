package com.missioncontrol.notificationservice.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.missioncontrol.notificationservice.client.UserClient;
import com.missioncontrol.notificationservice.dto.InternalUserResponse;
import com.missioncontrol.notificationservice.entity.Notification;
import com.missioncontrol.notificationservice.messaging.AlertCreatedEvent;
import com.missioncontrol.notificationservice.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserClient userClient;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserClient userClient) {

        this.notificationRepository = notificationRepository;
        this.userClient = userClient;
    }

    public void createFromAlert(AlertCreatedEvent event) {

        List<InternalUserResponse> activeUsers =
                userClient.getActiveUsers();

        for (InternalUserResponse user : activeUsers) {

            boolean alreadyExists =
                    notificationRepository
                            .existsByUserIdAndAlertId(
                                    user.id(),
                                    event.alertId()
                            );

            if (alreadyExists) {
                continue;
            }

            Notification notification =
                    new Notification(
                            user.id(),
                            event.alertId(),
                            event.vehicleId(),
                            event.type(),
                            event.severity(),
                            event.message()
                    );

            notificationRepository.save(notification);
        }
    }

    public List<Notification> getNotifications(
            Long userId) {

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        userId
                );
    }

    public long getUnreadCount(
            Long userId) {

        return notificationRepository
                .countByUserIdAndReadFalse(
                        userId
                );
    }

    public Notification markAsRead(
            Long notificationId,
            Long userId) {

        Notification notification =
                notificationRepository
                        .findByIdAndUserId(
                                notificationId,
                                userId
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Notification not found"
                                )
                        );

        notification.markAsRead();

        return notificationRepository.save(
                notification
        );
    }
}