package com.missioncontrol.auth.config;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.entity.UserRole;
import com.missioncontrol.auth.repository.UserRepository;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final String adminName;
    private final String adminEmail;
    private final String adminPassword;

    public AdminBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.name:}") String adminName,
            @Value("${app.bootstrap-admin.email:}") String adminEmail,
            @Value("${app.bootstrap-admin.password:}") String adminPassword) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminName = adminName;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {

        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }

        if (adminEmail.isBlank()) {
            log.warn(
                    "No ADMIN user exists. Configure BOOTSTRAP_ADMIN_* environment variables."
            );
            return;
        }

        String normalizedEmail =
                adminEmail.trim()
                        .toLowerCase(Locale.ROOT);

        userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .ifPresentOrElse(
                        user -> promoteExistingUser(user),
                        () -> createAdmin(normalizedEmail)
                );
    }

    private void promoteExistingUser(User user) {

        user.changeRole(UserRole.ADMIN);
        user.changeEnabled(true);

        userRepository.save(user);

        log.info(
                "Existing user promoted to ADMIN: {}",
                user.getEmail()
        );
    }

    private void createAdmin(String normalizedEmail) {

        if (adminName.isBlank()) {
            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_NAME is required"
            );
        }

        if (adminPassword.length() < 8
                || adminPassword.length() > 72) {

            throw new IllegalStateException(
                    "BOOTSTRAP_ADMIN_PASSWORD must be between 8 and 72 characters"
            );
        }

        User admin = new User(
                adminName.trim(),
                normalizedEmail,
                passwordEncoder.encode(adminPassword),
                UserRole.ADMIN
        );

        userRepository.save(admin);

        log.info(
                "Initial ADMIN user created: {}",
                normalizedEmail
        );
    }
}