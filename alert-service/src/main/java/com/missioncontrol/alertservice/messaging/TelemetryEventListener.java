package com.missioncontrol.alertservice.messaging;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.missioncontrol.alertservice.config.RabbitMqConfig;
import com.missioncontrol.alertservice.dto.TelemetryData;
import com.missioncontrol.alertservice.service.AlertService;

import tools.jackson.databind.ObjectMapper;

@Component
public class TelemetryEventListener {

    private final ObjectMapper objectMapper;
    private final AlertService alertService;

    public TelemetryEventListener(
            ObjectMapper objectMapper,
            AlertService alertService) {

        this.objectMapper = objectMapper;
        this.alertService = alertService;
    }

    @RabbitListener(
            queues = RabbitMqConfig.ALERT_TELEMETRY_QUEUE
    )
    public void handleTelemetryCreated(String message) {

        TelemetryData telemetry =
                objectMapper.readValue(
                        message,
                        TelemetryData.class
                );

        alertService.evaluateTelemetry(telemetry);
    }
}