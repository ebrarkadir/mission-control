package com.missioncontrol.auth.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.missioncontrol.auth.dto.UpdateUserEnabledRequest;
import com.missioncontrol.auth.dto.UpdateUserRoleRequest;
import com.missioncontrol.auth.dto.UserResponse;
import com.missioncontrol.auth.entity.User;
import com.missioncontrol.auth.service.AdminUserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(
            AdminUserService adminUserService) {

        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<UserResponse> getAllUsers() {

        return adminUserService
                .getAllUsers()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PatchMapping("/{id}/role")
    public UserResponse changeRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {

        User user =
                adminUserService.changeRole(
                        id,
                        request.role()
                );

        return toResponse(user);
    }

    @PatchMapping("/{id}/enabled")
    public UserResponse changeEnabled(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserEnabledRequest request) {

        User user =
                adminUserService.changeEnabled(
                        id,
                        request.enabled()
                );

        return toResponse(user);
    }

    private UserResponse toResponse(User user) {

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