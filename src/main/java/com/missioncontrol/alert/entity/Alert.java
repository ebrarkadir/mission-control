package com.missioncontrol.alert.entity;

import java.time.Instant;

import com.missioncontrol.telemetry.entity.TelemetryRecord;
import com.missioncontrol.vehicle.entity.Vehicle;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "telemetry_record_id")
    private TelemetryRecord telemetryRecord;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private AlertType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertSeverity severity;

    @Column(nullable = false, length = 255)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected Alert() {
    }

    public Alert(
            Vehicle vehicle,
            TelemetryRecord telemetryRecord,
            AlertType type,
            AlertSeverity severity,
            String message) {

        this.vehicle = vehicle;
        this.telemetryRecord = telemetryRecord;
        this.type = type;
        this.severity = severity;
        this.message = message;
        this.status = AlertStatus.OPEN;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    public void resolve() {
        this.status = AlertStatus.RESOLVED;
        this.resolvedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public TelemetryRecord getTelemetryRecord() {
        return telemetryRecord;
    }

    public AlertType getType() {
        return type;
    }

    public AlertSeverity getSeverity() {
        return severity;
    }

    public String getMessage() {
        return message;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }
}