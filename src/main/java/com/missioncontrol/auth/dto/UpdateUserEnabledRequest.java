package com.missioncontrol.auth.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserEnabledRequest(

        @NotNull
        Boolean enabled
) {
}