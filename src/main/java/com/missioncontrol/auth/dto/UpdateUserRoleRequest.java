package com.missioncontrol.auth.dto;

import com.missioncontrol.auth.entity.UserRole;

import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(

        @NotNull
        UserRole role
) {
}