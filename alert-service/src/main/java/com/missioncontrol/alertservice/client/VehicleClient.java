package com.missioncontrol.alertservice.client;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class VehicleClient {

    private final RestClient restClient;
    private final String internalApiKey;

    public VehicleClient(
            @Value("${app.core.base-url}") String coreBaseUrl,
            @Value("${app.internal-api-key}") String internalApiKey) {

        this.restClient = RestClient.create(coreBaseUrl);
        this.internalApiKey = internalApiKey;
    }

    public List<Long> getActiveVehicleIds() {

        List<Long> vehicleIds = restClient
                .get()
                .uri("/api/internal/vehicles/active")
                .header(
                        "X-Internal-Api-Key",
                        internalApiKey
                )
                .retrieve()
                .body(
                        new ParameterizedTypeReference<List<Long>>() {
                        }
                );

        return vehicleIds != null
                ? vehicleIds
                : List.of();
    }
}