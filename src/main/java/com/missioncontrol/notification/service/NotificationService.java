package com.missioncontrol.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.missioncontrol.alert.entity.Alert;
import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.exception.InvalidCredentialsException;
import com.missioncontrol.auth.repository.UserRepository;
import com.missioncontrol.notification.entity.Notification;
import com.missioncontrol.notification.exception.NotificationNotFoundException;
import com.missioncontrol.notification.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createNotificationsForAlert(Alert alert) {

        List<User> activeUsers =
                userRepository.findByEnabledTrue();

        for (User user : activeUsers) {

            Notification notification =
                    new Notification(
                            user,
                            alert,
                            alert.getMessage()
                    );

            notificationRepository.save(notification);
        }
    }

    public List<Notification> getNotifications(
            String email) {

        User user = getUser(email);

        return notificationRepository
                .findByUser_IdOrderByCreatedAtDesc(
                        user.getId()
                );
    }

    public long getUnreadCount(
            String email) {

        User user = getUser(email);

        return notificationRepository
                .countByUser_IdAndReadAtIsNull(
                        user.getId()
                );
    }

    public Notification markAsRead(
            Long notificationId,
            String email) {

        User user = getUser(email);

        Notification notification =
                notificationRepository
                        .findByIdAndUser_Id(
                                notificationId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new NotificationNotFoundException(
                                        notificationId
                                )
                        );

        notification.markAsRead();

        return notificationRepository.save(notification);
    }

    private User getUser(String email) {

        return userRepository
                .findByEmailIgnoreCase(email)
                .filter(User::isEnabled)
                .orElseThrow(InvalidCredentialsException::new);
    }
}