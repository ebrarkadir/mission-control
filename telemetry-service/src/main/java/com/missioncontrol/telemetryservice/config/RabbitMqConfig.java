package com.missioncontrol.telemetryservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String TELEMETRY_EXCHANGE =
            "telemetry.exchange";

    public static final String TELEMETRY_CREATED_ROUTING_KEY =
            "telemetry.created";

    @Bean
    public TopicExchange telemetryExchange() {
        return new TopicExchange(TELEMETRY_EXCHANGE);
    }
}