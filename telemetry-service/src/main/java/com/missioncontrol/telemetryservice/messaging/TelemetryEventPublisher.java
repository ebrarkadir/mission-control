package com.missioncontrol.telemetryservice.messaging;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import com.missioncontrol.telemetryservice.config.RabbitMqConfig;
import com.missioncontrol.telemetryservice.entity.TelemetryRecord;

import tools.jackson.databind.ObjectMapper;

@Component
public class TelemetryEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public TelemetryEventPublisher(
            RabbitTemplate rabbitTemplate,
            ObjectMapper objectMapper) {

        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    public void publishTelemetryCreated(
            TelemetryRecord telemetry) {

        TelemetryCreatedEvent event =
                new TelemetryCreatedEvent(
                        telemetry.getId(),
                        telemetry.getVehicleId(),
                        telemetry.getLatitude(),
                        telemetry.getLongitude(),
                        telemetry.getAltitude(),
                        telemetry.getSpeed(),
                        telemetry.getBattery(),
                        telemetry.getTemperature(),
                        telemetry.getRecordedAt()
                );

        String message =
                objectMapper.writeValueAsString(event);

        rabbitTemplate.convertAndSend(
                RabbitMqConfig.TELEMETRY_EXCHANGE,
                RabbitMqConfig.TELEMETRY_CREATED_ROUTING_KEY,
                message
        );
    }
}