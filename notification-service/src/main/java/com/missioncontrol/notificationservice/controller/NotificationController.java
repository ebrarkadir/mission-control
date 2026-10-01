package com.missioncontrol.notificationservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.notificationservice.entity.Notification;
import com.missioncontrol.notificationservice.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService) {

        this.notificationService = notificationService;
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<Notification> getVehicleNotifications(
            @PathVariable Long vehicleId) {

        return notificationService
                .getVehicleNotifications(vehicleId);
    }
}