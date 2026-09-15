package com.missioncontrol.alert.service;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.missioncontrol.alert.entity.Alert;
import com.missioncontrol.alert.entity.AlertStatus;
import com.missioncontrol.alert.entity.AlertType;
import com.missioncontrol.alert.repository.AlertRepository;
import com.missioncontrol.notification.service.NotificationService;
import com.missioncontrol.telemetry.entity.TelemetryRecord;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.service.VehicleService;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private VehicleService vehicleService;

    @Mock
    private NotificationService notificationService;

    private AlertService alertService;

    @BeforeEach
    void setUp() {

        alertService = new AlertService(
                alertRepository,
                vehicleService,
                notificationService
        );
    }

    @Test
    void shouldCreateLowBatteryAlertAndNotification() {

        Vehicle vehicle = org.mockito.Mockito.mock(Vehicle.class);
        TelemetryRecord telemetry =
                org.mockito.Mockito.mock(TelemetryRecord.class);

        when(vehicle.getId()).thenReturn(1L);
        when(telemetry.getVehicle()).thenReturn(vehicle);
        when(telemetry.getBattery()).thenReturn(10);
        when(telemetry.getTemperature()).thenReturn(40.0);

        when(alertRepository.existsByVehicle_IdAndTypeAndStatus(
                1L,
                AlertType.LOW_BATTERY,
                AlertStatus.OPEN
        )).thenReturn(false);

        when(alertRepository.save(any(Alert.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        alertService.evaluateTelemetry(telemetry);

        verify(alertRepository)
                .save(any(Alert.class));

        verify(notificationService)
                .createNotificationsForAlert(any(Alert.class));
    }

    @Test
    void shouldNotCreateDuplicateLowBatteryAlert() {

        Vehicle vehicle = org.mockito.Mockito.mock(Vehicle.class);
        TelemetryRecord telemetry =
                org.mockito.Mockito.mock(TelemetryRecord.class);

        when(vehicle.getId()).thenReturn(1L);
        when(telemetry.getVehicle()).thenReturn(vehicle);
        when(telemetry.getBattery()).thenReturn(10);
        when(telemetry.getTemperature()).thenReturn(40.0);

        when(alertRepository.existsByVehicle_IdAndTypeAndStatus(
                1L,
                AlertType.LOW_BATTERY,
                AlertStatus.OPEN
        )).thenReturn(true);

        alertService.evaluateTelemetry(telemetry);

        verify(notificationService, never())
                .createNotificationsForAlert(any(Alert.class));
    }

    @Test
    void shouldResolveLowBatteryAlertWhenBatteryRecovers() {

        Vehicle vehicle = org.mockito.Mockito.mock(Vehicle.class);
        TelemetryRecord telemetry =
                org.mockito.Mockito.mock(TelemetryRecord.class);
        Alert alert = org.mockito.Mockito.mock(Alert.class);

        when(vehicle.getId()).thenReturn(1L);
        when(telemetry.getVehicle()).thenReturn(vehicle);
        when(telemetry.getBattery()).thenReturn(80);
        when(telemetry.getTemperature()).thenReturn(40.0);

        when(alertRepository.findByVehicle_IdAndTypeAndStatus(
                1L,
                AlertType.CONNECTION_LOST,
                AlertStatus.OPEN
        )).thenReturn(Optional.empty());

        when(alertRepository.findByVehicle_IdAndTypeAndStatus(
                1L,
                AlertType.LOW_BATTERY,
                AlertStatus.OPEN
        )).thenReturn(Optional.of(alert));

        when(alertRepository.findByVehicle_IdAndTypeAndStatus(
                1L,
                AlertType.HIGH_TEMPERATURE,
                AlertStatus.OPEN
        )).thenReturn(Optional.empty());

        alertService.evaluateTelemetry(telemetry);

        verify(alert).resolve();
        verify(alertRepository).save(alert);
    }

    @Test
    void shouldCreateConnectionLostAlertAndNotification() {

        Vehicle vehicle = org.mockito.Mockito.mock(Vehicle.class);

        when(vehicle.getId()).thenReturn(1L);

        when(alertRepository.existsByVehicle_IdAndTypeAndStatus(
                1L,
                AlertType.CONNECTION_LOST,
                AlertStatus.OPEN
        )).thenReturn(false);

        when(alertRepository.save(any(Alert.class)))
                .thenAnswer(invocation ->
                        invocation.getArgument(0));

        alertService.createConnectionLostAlertIfNotOpen(vehicle);

        verify(alertRepository)
                .save(any(Alert.class));

        verify(notificationService)
                .createNotificationsForAlert(any(Alert.class));
    }
}