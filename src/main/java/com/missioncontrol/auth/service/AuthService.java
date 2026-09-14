package com.missioncontrol.auth.service;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.missioncontrol.auth.dto.LoginRequest;
import com.missioncontrol.auth.dto.RegisterRequest;
import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.entity.UserRole;
import com.missioncontrol.auth.exception.DuplicateUserEmailException;
import com.missioncontrol.auth.exception.InvalidCredentialsException;
import com.missioncontrol.auth.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(RegisterRequest request) {

        String normalizedEmail =
                request.email()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateUserEmailException(normalizedEmail);
        }

        String passwordHash =
                passwordEncoder.encode(request.password());

        User user = new User(
                request.name().trim(),
                normalizedEmail,
                passwordHash,
                UserRole.VIEWER
        );

        return userRepository.save(user);
    }

    public User login(LoginRequest request) {

        String normalizedEmail =
                request.email()
                        .trim()
                        .toLowerCase(Locale.ROOT);

        User user = userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(InvalidCredentialsException::new);

        boolean passwordMatches =
                passwordEncoder.matches(
                        request.password(),
                        user.getPasswordHash()
                );

        if (!passwordMatches || !user.isEnabled()) {
            throw new InvalidCredentialsException();
        }

        return user;
    }

    public User getCurrentUser(String email) {

        return userRepository
                .findByEmailIgnoreCase(email)
                .filter(User::isEnabled)
                .orElseThrow(InvalidCredentialsException::new);
    }
}