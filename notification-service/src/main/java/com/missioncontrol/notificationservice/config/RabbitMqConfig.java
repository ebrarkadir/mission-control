package com.missioncontrol.notificationservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    public static final String ALERT_EXCHANGE =
            "alert.exchange";

    public static final String ALERT_CREATED_ROUTING_KEY =
            "alert.created";

    public static final String NOTIFICATION_ALERT_QUEUE =
            "notification.alert.queue";

    @Bean
    public TopicExchange alertExchange() {
        return new TopicExchange(ALERT_EXCHANGE);
    }

    @Bean
    public Queue notificationAlertQueue() {
        return QueueBuilder
                .durable(NOTIFICATION_ALERT_QUEUE)
                .build();
    }

    @Bean
    public Binding notificationAlertBinding(
            Queue notificationAlertQueue,
            TopicExchange alertExchange) {

        return BindingBuilder
                .bind(notificationAlertQueue)
                .to(alertExchange)
                .with(ALERT_CREATED_ROUTING_KEY);
    }
}