package com.missioncontrol.auth.dto;

import java.time.Instant;

import com.missioncontrol.auth.entity.UserRole;

public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        boolean enabled,
        Instant createdAt
) {
}