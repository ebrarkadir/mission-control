package com.missioncontrol.telemetry.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.missioncontrol.alert.service.AlertService;
import com.missioncontrol.telemetry.entity.TelemetryRecord;
import com.missioncontrol.telemetry.exception.TelemetryNotFoundException;
import com.missioncontrol.telemetry.repository.TelemetryRepository;
import com.missioncontrol.vehicle.entity.Vehicle;
import com.missioncontrol.vehicle.service.VehicleService;

@ExtendWith(MockitoExtension.class)
class TelemetryServiceTest {

    @Mock
    private TelemetryRepository telemetryRepository;

    @Mock
    private VehicleService vehicleService;

    @Mock
    private TelemetryStreamService telemetryStreamService;

    @Mock
    private AlertService alertService;

    private TelemetryService telemetryService;

    @BeforeEach
    void setUp() {

        telemetryService = new TelemetryService(
                telemetryRepository,
                vehicleService,
                telemetryStreamService,
                alertService
        );
    }

    @Test
    void shouldCreateTelemetryAndTriggerAlertAndStream() {

        Vehicle vehicle =
                org.mockito.Mockito.mock(Vehicle.class);

        TelemetryRecord savedTelemetry =
                org.mockito.Mockito.mock(TelemetryRecord.class);

        when(vehicleService.getVehicleById(1L))
                .thenReturn(vehicle);

        when(telemetryRepository.save(
                any(TelemetryRecord.class)))
                .thenReturn(savedTelemetry);

        Instant recordedAt = Instant.now();

        TelemetryRecord result =
                telemetryService.createTelemetry(
                        1L,
                        39.9255,
                        32.8663,
                        1200.0,
                        80.0,
                        75,
                        40.0,
                        recordedAt
                );

        assertEquals(savedTelemetry, result);

        verify(telemetryRepository)
                .save(any(TelemetryRecord.class));

        verify(alertService)
                .evaluateTelemetry(savedTelemetry);

        verify(telemetryStreamService)
                .publish(savedTelemetry);
    }

    @Test
    void shouldReturnLatestTelemetry() {

        TelemetryRecord telemetry =
                org.mockito.Mockito.mock(TelemetryRecord.class);

        when(telemetryRepository
                .findTopByVehicle_IdOrderByRecordedAtDesc(1L))
                .thenReturn(Optional.of(telemetry));

        TelemetryRecord result =
                telemetryService.getLatestTelemetry(1L);

        assertEquals(telemetry, result);

        verify(vehicleService)
                .getVehicleById(1L);
    }

    @Test
    void shouldThrowWhenLatestTelemetryDoesNotExist() {

        when(telemetryRepository
                .findTopByVehicle_IdOrderByRecordedAtDesc(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                TelemetryNotFoundException.class,
                () -> telemetryService
                        .getLatestTelemetry(1L)
        );

        verify(vehicleService)
                .getVehicleById(1L);
    }

    @Test
    void shouldReturnTelemetryHistory() {

        TelemetryRecord first =
                org.mockito.Mockito.mock(TelemetryRecord.class);

        TelemetryRecord second =
                org.mockito.Mockito.mock(TelemetryRecord.class);

        when(telemetryRepository
                .findTop100ByVehicle_IdOrderByRecordedAtDesc(1L))
                .thenReturn(List.of(first, second));

        List<TelemetryRecord> result =
                telemetryService.getTelemetryHistory(1L);

        assertEquals(2, result.size());
        assertEquals(first, result.get(0));
        assertEquals(second, result.get(1));

        verify(vehicleService)
                .getVehicleById(1L);
    }
}