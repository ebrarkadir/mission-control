package com.missioncontrol.telemetryservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import com.missioncontrol.telemetryservice.exception.VehicleNotFoundException;

@Component
public class RestVehicleClient implements VehicleClient {

    private final RestClient restClient;
    private final String internalApiKey;

    public RestVehicleClient(
            @Value("${app.core.base-url}") String coreBaseUrl,
            @Value("${app.internal-api-key}") String internalApiKey) {

        this.restClient = RestClient.builder()
                .baseUrl(coreBaseUrl)
                .build();

        this.internalApiKey = internalApiKey;
    }

    @Override
    public void validateVehicleExists(Long vehicleId) {

        try {
            restClient.get()
                    .uri(
                            "/api/internal/vehicles/{vehicleId}/exists",
                            vehicleId
                    )
                    .header(
                            "X-Internal-Api-Key",
                            internalApiKey
                    )
                    .retrieve()
                    .toBodilessEntity();

        } catch (HttpClientErrorException.NotFound exception) {
            throw new VehicleNotFoundException(vehicleId);
        }
    }
}