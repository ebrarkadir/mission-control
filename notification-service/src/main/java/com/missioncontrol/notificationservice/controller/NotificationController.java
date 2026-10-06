package com.missioncontrol.notificationservice.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.notificationservice.dto.NotificationResponse;
import com.missioncontrol.notificationservice.dto.UnreadNotificationCountResponse;
import com.missioncontrol.notificationservice.entity.Notification;
import com.missioncontrol.notificationservice.security.JwtUserPrincipal;
import com.missioncontrol.notificationservice.service.NotificationService;

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

        Long userId =
                getPrincipal(authentication).userId();

        return notificationService
                .getNotifications(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/unread-count")
    public UnreadNotificationCountResponse getUnreadCount(
            Authentication authentication) {

        Long userId =
                getPrincipal(authentication).userId();

        long count =
                notificationService.getUnreadCount(
                        userId
                );

        return new UnreadNotificationCountResponse(
                count
        );
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId =
                getPrincipal(authentication).userId();

        Notification notification =
                notificationService.markAsRead(
                        id,
                        userId
                );

        return toResponse(notification);
    }

    private JwtUserPrincipal getPrincipal(
            Authentication authentication) {

        return (JwtUserPrincipal)
                authentication.getPrincipal();
    }

    private NotificationResponse toResponse(
            Notification notification) {

        return new NotificationResponse(
                notification.getId(),
                notification.getAlertId(),
                notification.getMessage(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}