package com.missioncontrol.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.entity.UserRole;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {

        String secret =
                "bWlzc2lvbi1jb250cm9sLWRldi1qd3Qtc2VjcmV0LWtleS0yMDI2LW11c3QtYmUtbG9uZw==";

        jwtService = new JwtService(
                secret,
                3600
        );
    }

    @Test
    void shouldGenerateValidToken() {

        User user = new User(
                "Kadir Cetin",
                "kadir@test.com",
                "hashed-password",
                UserRole.VIEWER
        );

        String token =
                jwtService.generateToken(user);

        assertTrue(jwtService.isTokenValid(token));

        assertEquals(
                "kadir@test.com",
                jwtService.extractEmail(token)
        );
    }

    @Test
    void shouldRejectInvalidToken() {

        String invalidToken =
                "invalid.jwt.token";

        assertFalse(
                jwtService.isTokenValid(invalidToken)
        );
    }
}