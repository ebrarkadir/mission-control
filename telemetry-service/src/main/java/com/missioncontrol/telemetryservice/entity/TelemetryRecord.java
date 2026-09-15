package com.missioncontrol.telemetryservice.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "telemetry_records")
public class TelemetryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(nullable = false)
    private double altitude;

    @Column(nullable = false)
    private double speed;

    @Column(nullable = false)
    private int battery;

    @Column(nullable = false)
    private double temperature;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected TelemetryRecord() {
    }

    public TelemetryRecord(
            Long vehicleId,
            double latitude,
            double longitude,
            double altitude,
            double speed,
            int battery,
            double temperature,
            Instant recordedAt) {

        this.vehicleId = vehicleId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.altitude = altitude;
        this.speed = speed;
        this.battery = battery;
        this.temperature = temperature;
        this.recordedAt = recordedAt;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public double getAltitude() {
        return altitude;
    }

    public double getSpeed() {
        return speed;
    }

    public int getBattery() {
        return battery;
    }

    public double getTemperature() {
        return temperature;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}