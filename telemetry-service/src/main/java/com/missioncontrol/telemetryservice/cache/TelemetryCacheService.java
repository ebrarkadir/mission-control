package com.missioncontrol.telemetryservice.cache;

import java.time.Duration;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.missioncontrol.telemetryservice.entity.TelemetryRecord;

import tools.jackson.databind.ObjectMapper;

@Service
public class TelemetryCacheService {

    private static final Logger log =
            LoggerFactory.getLogger(TelemetryCacheService.class);

    private static final String KEY_PREFIX =
            "telemetry:latest:";

    private static final Duration CACHE_TTL =
            Duration.ofMinutes(10);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public TelemetryCacheService(
            StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {

        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<TelemetryCacheEntry> getLatest(
            Long vehicleId) {

        try {
            String json = redisTemplate
                    .opsForValue()
                    .get(buildKey(vehicleId));

            if (json == null) {
                return Optional.empty();
            }

            TelemetryCacheEntry cachedTelemetry =
                    objectMapper.readValue(
                            json,
                            TelemetryCacheEntry.class
                    );

            return Optional.of(cachedTelemetry);

        } catch (Exception exception) {

            log.warn(
                    "Failed to read telemetry cache for vehicle {}",
                    vehicleId,
                    exception
            );

            return Optional.empty();
        }
    }

    public void putLatest(TelemetryRecord telemetry) {

        try {
            TelemetryCacheEntry cacheEntry =
                    TelemetryCacheEntry.from(telemetry);

            String json =
                    objectMapper.writeValueAsString(cacheEntry);

            redisTemplate
                    .opsForValue()
                    .set(
                            buildKey(telemetry.getVehicleId()),
                            json,
                            CACHE_TTL
                    );

        } catch (Exception exception) {

            log.warn(
                    "Failed to cache latest telemetry for vehicle {}",
                    telemetry.getVehicleId(),
                    exception
            );
        }
    }

    public void evictLatest(Long vehicleId) {

        try {
            redisTemplate.delete(
                    buildKey(vehicleId)
            );

        } catch (Exception exception) {

            log.warn(
                    "Failed to evict telemetry cache for vehicle {}",
                    vehicleId,
                    exception
            );
        }
    }

    private String buildKey(Long vehicleId) {
        return KEY_PREFIX + vehicleId;
    }
}