package com.missioncontrol.notificationservice.security;

public record JwtUserPrincipal(
        Long userId,
        String email,
        String role) {
}