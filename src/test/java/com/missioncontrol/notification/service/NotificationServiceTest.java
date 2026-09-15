package com.missioncontrol.notification.service;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.missioncontrol.alert.entity.Alert;
import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.repository.UserRepository;
import com.missioncontrol.notification.entity.Notification;
import com.missioncontrol.notification.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {

        notificationService = new NotificationService(
                notificationRepository,
                userRepository
        );
    }

    @Test
    void shouldCreateNotificationForEveryActiveUser() {

        Alert alert = org.mockito.Mockito.mock(Alert.class);

        User user1 = org.mockito.Mockito.mock(User.class);
        User user2 = org.mockito.Mockito.mock(User.class);

        when(alert.getMessage())
                .thenReturn("Vehicle battery is below 20%");

        when(userRepository.findByEnabledTrue())
                .thenReturn(List.of(user1, user2));

        notificationService.createNotificationsForAlert(alert);

        verify(notificationRepository,
                org.mockito.Mockito.times(2))
                .save(any(Notification.class));
    }

    @Test
    void shouldReturnUnreadNotificationCount() {

        User user = org.mockito.Mockito.mock(User.class);

        when(user.getId())
                .thenReturn(10L);

        when(userRepository.findByEmailIgnoreCase(
                "user@test.com"))
                .thenReturn(Optional.of(user));

        when(user.isEnabled())
                .thenReturn(true);

        when(notificationRepository
                .countByUser_IdAndReadAtIsNull(10L))
                .thenReturn(3L);

        long count =
                notificationService.getUnreadCount(
                        "user@test.com"
                );

        assertEquals(3L, count);
    }

    @Test
    void shouldMarkNotificationAsRead() {

        User user = org.mockito.Mockito.mock(User.class);
        Notification notification =
                org.mockito.Mockito.mock(Notification.class);

        when(user.getId())
                .thenReturn(10L);

        when(userRepository.findByEmailIgnoreCase(
                "user@test.com"))
                .thenReturn(Optional.of(user));

        when(user.isEnabled())
                .thenReturn(true);

        when(notificationRepository.findByIdAndUser_Id(
                5L,
                10L))
                .thenReturn(Optional.of(notification));

        when(notificationRepository.save(notification))
                .thenReturn(notification);

        Notification result =
                notificationService.markAsRead(
                        5L,
                        "user@test.com"
                );

        verify(notification).markAsRead();
        verify(notificationRepository).save(notification);

        assertEquals(notification, result);
    }
}