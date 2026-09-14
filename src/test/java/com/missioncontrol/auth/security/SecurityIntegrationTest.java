package com.missioncontrol.auth.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.entity.UserRole;
import com.missioncontrol.auth.repository.UserRepository;
import com.missioncontrol.auth.service.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Test
    void shouldReturnUnauthorizedWithoutToken() throws Exception {

        mockMvc.perform(
                get("/api/vehicles")
        )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void shouldAllowViewerToReadVehicles() throws Exception {

        String token = createToken(
                "security-viewer@test.com",
                UserRole.VIEWER
        );

        mockMvc.perform(
                get("/api/vehicles")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
        )
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectViewerFromCreatingVehicle() throws Exception {

        String token = createToken(
                "security-viewer-write@test.com",
                UserRole.VIEWER
        );

        mockMvc.perform(
                post("/api/vehicles")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "TEST-UAV-VIEWER",
                                  "type": "UAV",
                                  "status": "ACTIVE"
                                }
                                """)
        )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    void shouldAllowOperatorToCreateVehicle() throws Exception {

        String token = createToken(
                "security-operator@test.com",
                UserRole.OPERATOR
        );

        mockMvc.perform(
                post("/api/vehicles")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "TEST-UAV-OPERATOR",
                                  "type": "UAV",
                                  "status": "ACTIVE"
                                }
                                """)
        )
                .andExpect(status().isCreated());
    }

    @Test
    void shouldAllowAdminToCreateVehicle() throws Exception {

        String token = createToken(
                "security-admin@test.com",
                UserRole.ADMIN
        );

        mockMvc.perform(
                post("/api/vehicles")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "TEST-UAV-ADMIN",
                                  "type": "UAV",
                                  "status": "ACTIVE"
                                }
                                """)
        )
                .andExpect(status().isCreated());
    }

    @Test
    void shouldReturnCurrentAuthenticatedUser() throws Exception {

        String token = createToken(
                "security-me@test.com",
                UserRole.VIEWER
        );

        mockMvc.perform(
                get("/api/auth/me")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
        )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.email")
                                .value("security-me@test.com")
                )
                .andExpect(
                        jsonPath("$.role")
                                .value("VIEWER")
                );
    }

    @Test
    void shouldRejectCurrentUserWithoutToken() throws Exception {

        mockMvc.perform(
                get("/api/auth/me")
        )
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    private String createToken(
            String email,
            UserRole role) {

        User user = new User(
                "Security Test User",
                email,
                "test-password-hash",
                role
        );

        User savedUser =
                userRepository.save(user);

        return jwtService.generateToken(savedUser);
    }
}