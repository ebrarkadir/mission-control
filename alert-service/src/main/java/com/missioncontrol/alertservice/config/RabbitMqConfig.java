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

    public static final String TELEMETRY_DLX =
            "telemetry.dlx";

    public static final String ALERT_TELEMETRY_DLQ =
            "alert.telemetry.dlq";

    public static final String TELEMETRY_FAILED_ROUTING_KEY =
            "telemetry.failed";

    public static final String ALERT_EXCHANGE =
            "alert.exchange";

    public static final String ALERT_CREATED_ROUTING_KEY =
            "alert.created";

    @Bean
    public TopicExchange telemetryExchange() {
        return new TopicExchange(TELEMETRY_EXCHANGE);
    }

    @Bean
    public TopicExchange telemetryDeadLetterExchange() {
        return new TopicExchange(TELEMETRY_DLX);
    }

    @Bean
    public TopicExchange alertExchange() {
        return new TopicExchange(ALERT_EXCHANGE);
    }

    @Bean
    public Queue alertTelemetryQueue() {
        return QueueBuilder
                .durable(ALERT_TELEMETRY_QUEUE)
                .deadLetterExchange(TELEMETRY_DLX)
                .deadLetterRoutingKey(TELEMETRY_FAILED_ROUTING_KEY)
                .build();
    }

    @Bean
    public Queue alertTelemetryDeadLetterQueue() {
        return QueueBuilder
                .durable(ALERT_TELEMETRY_DLQ)
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

    @Bean
    public Binding alertTelemetryDeadLetterBinding(
            Queue alertTelemetryDeadLetterQueue,
            TopicExchange telemetryDeadLetterExchange) {

        return BindingBuilder
                .bind(alertTelemetryDeadLetterQueue)
                .to(telemetryDeadLetterExchange)
                .with(TELEMETRY_FAILED_ROUTING_KEY);
    }
}