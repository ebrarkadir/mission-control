package com.missioncontrol.auth.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.missioncontrol.auth.dto.InternalUserResponse;
import com.missioncontrol.auth.repository.UserRepository;

@RestController
@RequestMapping("/api/internal/users")
public class InternalUserController {

    private final UserRepository userRepository;
    private final String internalApiKey;

    public InternalUserController(
            UserRepository userRepository,
            @Value("${app.internal-api-key}") String internalApiKey) {

        this.userRepository = userRepository;
        this.internalApiKey = internalApiKey;
    }

    @GetMapping("/active")
    public List<InternalUserResponse> getActiveUsers(
            @RequestHeader(
                    value = "X-Internal-Api-Key",
                    required = false
            ) String apiKey) {

        validateInternalApiKey(apiKey);

        return userRepository
                .findByEnabledTrue()
                .stream()
                .map(user ->
                        new InternalUserResponse(
                                user.getId(),
                                user.getEmail()
                        )
                )
                .toList();
    }

    private void validateInternalApiKey(String apiKey) {

        if (!internalApiKey.equals(apiKey)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid internal API key"
            );
        }
    }
}