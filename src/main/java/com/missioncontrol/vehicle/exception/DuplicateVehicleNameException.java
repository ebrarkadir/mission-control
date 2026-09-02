package com.missioncontrol.vehicle.exception;

public class DuplicateVehicleNameException extends RuntimeException {

    public DuplicateVehicleNameException(String name) {
        super("Vehicle already exists with name: " + name);
    }
}