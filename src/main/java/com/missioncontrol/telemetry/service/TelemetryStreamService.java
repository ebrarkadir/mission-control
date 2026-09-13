package com.missioncontrol.telemetry.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.missioncontrol.telemetry.dto.TelemetryResponse;
import com.missioncontrol.telemetry.entity.TelemetryRecord;

@Service
public class TelemetryStreamService {

    private final Map<Long, List<SseEmitter>> emitters =
            new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long vehicleId) {

        SseEmitter emitter = new SseEmitter(0L);

        emitters.computeIfAbsent(
                vehicleId,
                id -> new CopyOnWriteArrayList<>()
        ).add(emitter);

        emitter.onCompletion(() ->
                removeEmitter(vehicleId, emitter));

        emitter.onTimeout(() ->
                removeEmitter(vehicleId, emitter));

        emitter.onError(error ->
                removeEmitter(vehicleId, emitter));

        return emitter;
    }

    public void publish(TelemetryRecord telemetry) {

        Long vehicleId = telemetry.getVehicle().getId();

        List<SseEmitter> vehicleEmitters =
                emitters.get(vehicleId);

        if (vehicleEmitters == null) {
            return;
        }

        TelemetryResponse response = new TelemetryResponse(
                telemetry.getId(),
                vehicleId,
                telemetry.getLatitude(),
                telemetry.getLongitude(),
                telemetry.getAltitude(),
                telemetry.getSpeed(),
                telemetry.getBattery(),
                telemetry.getTemperature(),
                telemetry.getRecordedAt(),
                telemetry.getCreatedAt()
        );

        for (SseEmitter emitter : vehicleEmitters) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .name("telemetry")
                                .data(response)
                );
            } catch (IOException exception) {
                removeEmitter(vehicleId, emitter);
            }
        }
    }

    private void removeEmitter(
            Long vehicleId,
            SseEmitter emitter) {

        List<SseEmitter> vehicleEmitters =
                emitters.get(vehicleId);

        if (vehicleEmitters == null) {
            return;
        }

        vehicleEmitters.remove(emitter);

        if (vehicleEmitters.isEmpty()) {
            emitters.remove(vehicleId);
        }
    }
}