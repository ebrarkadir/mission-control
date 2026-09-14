package com.missioncontrol.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.missioncontrol.auth.dto.LoginRequest;
import com.missioncontrol.auth.dto.RegisterRequest;
import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.entity.UserRole;
import com.missioncontrol.auth.exception.DuplicateUserEmailException;
import com.missioncontrol.auth.exception.InvalidCredentialsException;
import com.missioncontrol.auth.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder
        );
    }

    @Test
    void shouldRegisterUserWithViewerRole() {

        RegisterRequest request = new RegisterRequest(
                "Kadir Cetin",
                "KADIR@TEST.COM",
                "Test1234"
        );

        when(userRepository.existsByEmailIgnoreCase("kadir@test.com"))
                .thenReturn(false);

        when(passwordEncoder.encode("Test1234"))
                .thenReturn("hashed-password");

        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        User user = authService.register(request);

        assertEquals("Kadir Cetin", user.getName());
        assertEquals("kadir@test.com", user.getEmail());
        assertEquals("hashed-password", user.getPasswordHash());
        assertEquals(UserRole.VIEWER, user.getRole());
        assertTrue(user.isEnabled());

        verify(passwordEncoder).encode("Test1234");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldRejectDuplicateEmail() {

        RegisterRequest request = new RegisterRequest(
                "Kadir Cetin",
                "kadir@test.com",
                "Test1234"
        );

        when(userRepository.existsByEmailIgnoreCase("kadir@test.com"))
                .thenReturn(true);

        assertThrows(
                DuplicateUserEmailException.class,
                () -> authService.register(request)
        );

        verify(userRepository, never())
                .save(any(User.class));
    }

    @Test
    void shouldLoginWithValidCredentials() {

        User user = new User(
                "Kadir Cetin",
                "kadir@test.com",
                "hashed-password",
                UserRole.VIEWER
        );

        when(userRepository.findByEmailIgnoreCase("kadir@test.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "Test1234",
                "hashed-password"))
                .thenReturn(true);

        User result = authService.login(
                new LoginRequest(
                        "kadir@test.com",
                        "Test1234"
                )
        );

        assertEquals("kadir@test.com", result.getEmail());
    }

    @Test
    void shouldRejectInvalidPassword() {

        User user = new User(
                "Kadir Cetin",
                "kadir@test.com",
                "hashed-password",
                UserRole.VIEWER
        );

        when(userRepository.findByEmailIgnoreCase("kadir@test.com"))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "wrong-password",
                "hashed-password"))
                .thenReturn(false);

        assertThrows(
                InvalidCredentialsException.class,
                () -> authService.login(
                        new LoginRequest(
                                "kadir@test.com",
                                "wrong-password"
                        )
                )
        );
    }
}