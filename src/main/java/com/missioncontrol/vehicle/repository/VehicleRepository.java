package com.missioncontrol.vehicle.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.missioncontrol.vehicle.entity.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    boolean existsByName(String name);

}