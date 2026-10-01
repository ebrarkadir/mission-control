package com.missioncontrol.notificationservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.missioncontrol.notificationservice.config.RabbitMqConfig;
import com.missioncontrol.notificationservice.service.NotificationService;

import tools.jackson.databind.ObjectMapper;

@Component
public class AlertEventListener {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public AlertEventListener(
            ObjectMapper objectMapper,
            NotificationService notificationService) {

        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @RabbitListener(
            queues = RabbitMqConfig.NOTIFICATION_ALERT_QUEUE
    )
    public void handleAlertCreated(String message) {

        AlertCreatedEvent event =
                objectMapper.readValue(
                        message,
                        AlertCreatedEvent.class
                );

        notificationService.createFromAlert(event);
    }
}