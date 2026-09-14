package com.missioncontrol.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.auth.dto.LoginRequest;
import com.missioncontrol.auth.dto.LoginResponse;
import com.missioncontrol.auth.dto.RegisterRequest;
import com.missioncontrol.auth.dto.UserResponse;
import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.service.AuthService;
import com.missioncontrol.auth.service.JwtService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            JwtService jwtService) {

        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(
            @Valid @RequestBody RegisterRequest request) {

        User user = authService.register(request);

        return toUserResponse(user);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request) {

        User user = authService.login(request);

        String accessToken =
                jwtService.generateToken(user);

        return new LoginResponse(
                accessToken,
                "Bearer",
                jwtService.getExpirationSeconds(),
                toUserResponse(user)
        );
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(
            Authentication authentication) {

        User user = authService.getCurrentUser(
                authentication.getName()
        );

        return toUserResponse(user);
    }

    private UserResponse toUserResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }
}