package com.missioncontrol.alertservice.client;

import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.missioncontrol.alertservice.dto.LatestTelemetryResponse;

@Component
public class TelemetryClient {

    private final RestClient restClient;

    public TelemetryClient(
            @Value("${app.telemetry.base-url}")
            String telemetryBaseUrl) {

        this.restClient =
                RestClient.create(telemetryBaseUrl);
    }

    public Optional<Instant> getLatestReceivedAt(
            Long vehicleId) {

        try {
            LatestTelemetryResponse response =
                    restClient
                            .get()
                            .uri(
                                    "/api/vehicles/{vehicleId}/telemetry/latest",
                                    vehicleId
                            )
                            .retrieve()
                            .body(LatestTelemetryResponse.class);

            if (response == null) {
                return Optional.empty();
            }

            return Optional.ofNullable(
                    response.createdAt()
            );

        } catch (RestClientResponseException exception) {

            if (exception.getStatusCode().value() == 404) {
                return Optional.empty();
            }

            throw exception;
        }
    }
}