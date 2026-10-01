package com.missioncontrol.alertservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String TELEMETRY_EXCHANGE =
            "telemetry.exchange";

    public static final String TELEMETRY_CREATED_ROUTING_KEY =
            "telemetry.created";

    public static final String ALERT_TELEMETRY_QUEUE =
            "alert.telemetry.queue";

    @Bean
    public TopicExchange telemetryExchange() {
        return new TopicExchange(TELEMETRY_EXCHANGE);
    }

    @Bean
    public Queue alertTelemetryQueue() {
        return QueueBuilder
                .durable(ALERT_TELEMETRY_QUEUE)
                .build();
    }

    @Bean
    public Binding alertTelemetryBinding(
            Queue alertTelemetryQueue,
            TopicExchange telemetryExchange) {

        return BindingBuilder
                .bind(alertTelemetryQueue)
                .to(telemetryExchange)
                .with(TELEMETRY_CREATED_ROUTING_KEY);
    }
}