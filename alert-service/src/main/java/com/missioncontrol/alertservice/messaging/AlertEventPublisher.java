package com.missioncontrol.alertservice.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.missioncontrol.alertservice.config.RabbitMqConfig;
import com.missioncontrol.alertservice.entity.Alert;

import tools.jackson.databind.ObjectMapper;

@Component
public class AlertEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public AlertEventPublisher(
            RabbitTemplate rabbitTemplate,
            ObjectMapper objectMapper) {

        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishAlertCreated(Alert alert) {

        AlertCreatedEvent event =
                new AlertCreatedEvent(
                        alert.getId(),
                        alert.getVehicleId(),
                        alert.getType().name(),
                        alert.getSeverity().name(),
                        alert.getMessage(),
                        alert.getCreatedAt()
                );

        String message =
                objectMapper.writeValueAsString(event);

        rabbitTemplate.convertAndSend(
                RabbitMqConfig.ALERT_EXCHANGE,
                RabbitMqConfig.ALERT_CREATED_ROUTING_KEY,
                message
        );
    }
}