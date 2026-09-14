package com.missioncontrol.auth.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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

        String token = createViewerToken();

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

        String token = createViewerToken();

        mockMvc.perform(
                post("/api/vehicles")
                        .header(
                                "Authorization",
                                "Bearer " + token
                        )
        )
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    private String createViewerToken() {

        User user = new User(
                "Security Test Viewer",
                "security-viewer@test.com",
                "test-password-hash",
                UserRole.VIEWER
        );

        User savedUser =
                userRepository.save(user);

        return jwtService.generateToken(savedUser);
    }
}