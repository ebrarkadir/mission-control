package com.missioncontrol.notificationservice.client;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.missioncontrol.notificationservice.dto.InternalUserResponse;

@Component
public class UserClient {

    private final RestClient restClient;
    private final String internalApiKey;

    public UserClient(
            @Value("${app.core.base-url}") String coreBaseUrl,
            @Value("${app.internal-api-key}") String internalApiKey) {

        this.restClient = RestClient.create(coreBaseUrl);
        this.internalApiKey = internalApiKey;
    }

    public List<InternalUserResponse> getActiveUsers() {

        List<InternalUserResponse> users =
                restClient
                        .get()
                        .uri("/api/internal/users/active")
                        .header(
                                "X-Internal-Api-Key",
                                internalApiKey
                        )
                        .retrieve()
                        .body(
                                new ParameterizedTypeReference<
                                        List<InternalUserResponse>>() {
                                }
                        );

        return users != null
                ? users
                : List.of();
    }
}