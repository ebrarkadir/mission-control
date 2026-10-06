package com.missioncontrol.notificationservice.security;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey signingKey;

    public JwtService(
            @Value("${app.jwt.secret}") String secret) {

        this.signingKey =
                Keys.hmacShaKeyFor(
                        Decoders.BASE64.decode(secret)
                );
    }

    public boolean isTokenValid(String token) {

        try {
            parseClaims(token);
            return true;

        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    public Long extractUserId(String token) {

        Object value =
                parseClaims(token).get("userId");

        if (value instanceof Number number) {
            return number.longValue();
        }

        return Long.valueOf(value.toString());
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {

        return parseClaims(token)
                .get("role", String.class);
    }

    private Claims parseClaims(String token) {

        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}