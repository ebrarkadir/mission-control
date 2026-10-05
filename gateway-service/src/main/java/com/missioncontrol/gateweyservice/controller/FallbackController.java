package com.missioncontrol.gatewayservice.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FallbackController {

    @RequestMapping("/fallback/notifications")
    public ResponseEntity<Map<String, Object>>
            notificationFallback() {

        return unavailableResponse(
                "notification-service",
                "Notification service is temporarily unavailable"
        );
    }

    @RequestMapping("/fallback/alerts")
    public ResponseEntity<Map<String, Object>>
            alertFallback() {

        return unavailableResponse(
                "alert-service",
                "Alert service is temporarily unavailable"
        );
    }

    @RequestMapping("/fallback/telemetry")
    public ResponseEntity<Map<String, Object>>
            telemetryFallback() {

        return unavailableResponse(
                "telemetry-service",
                "Telemetry service is temporarily unavailable"
        );
    }

    private ResponseEntity<Map<String, Object>>
            unavailableResponse(
                    String service,
                    String message) {

        Map<String, Object> response = Map.of(
                "service", service,
                "status", "unavailable",
                "message", message
        );

        return ResponseEntity
                .status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(response);
    }
}