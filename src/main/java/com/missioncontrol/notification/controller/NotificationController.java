package com.missioncontrol.notification.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.notification.dto.NotificationResponse;
import com.missioncontrol.notification.dto.UnreadNotificationCountResponse;
import com.missioncontrol.notification.entity.Notification;
import com.missioncontrol.notification.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> getNotifications(
            Authentication authentication) {

        return notificationService
                .getNotifications(
                        authentication.getName()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/unread-count")
    public UnreadNotificationCountResponse getUnreadCount(
            Authentication authentication) {

        long count =
                notificationService.getUnreadCount(
                        authentication.getName()
                );

        return new UnreadNotificationCountResponse(
                count
        );
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        Notification notification =
                notificationService.markAsRead(
                        id,
                        authentication.getName()
                );

        return toResponse(notification);
    }

    private NotificationResponse toResponse(
            Notification notification) {

        return new NotificationResponse(
                notification.getId(),
                notification.getAlert().getId(),
                notification.getMessage(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}