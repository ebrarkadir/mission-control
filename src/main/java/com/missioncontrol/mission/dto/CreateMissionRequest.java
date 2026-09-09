package com.missioncontrol.mission.dto;

import com.missioncontrol.mission.entity.MissionType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateMissionRequest(

        @NotBlank
        @Size(max = 150)
        String name,

        @NotNull
        MissionType type

) {
}