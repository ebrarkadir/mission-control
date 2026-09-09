package com.missioncontrol.mission.exception;

public class MissionNotFoundException extends RuntimeException {

    public MissionNotFoundException(Long id) {
        super("Mission not found with id: " + id);
    }
}