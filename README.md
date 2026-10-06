# Mission Control & Telemetry Platform

A mission control and vehicle telemetry platform built with Java 21 and Spring Boot.

The project started as a modular monolith and was gradually evolved into a microservice architecture to practice real-world backend concepts such as asynchronous messaging, service-to-service communication, caching, API Gateway patterns, fault tolerance, authentication, and containerized deployment.

## Architecture

```text
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │    localhost:5173   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Gateway Service   │
                         │       :8084         │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
    ┌────────────────┐    ┌──────────────────┐    ┌──────────────────┐
    │  Core Service  │    │ Telemetry Service│    │  Alert Service   │
    │     :8080      │    │      :8081       │    │      :8082       │
    │                │    │                  │    │                  │
    │ Auth           │◄───│ Vehicle check    │    │ Alert rules      │
    │ Vehicles       │    │ Telemetry ingest │───►│ Connection loss  │
    │ Missions       │    │ Redis cache      │    │                  │
    └───────┬────────┘    └────────┬─────────┘    └────────┬─────────┘
            │                      │                       │
            │                      ▼                       ▼
            │                 ┌──────────┐           ┌──────────┐
            │                 │ RabbitMQ │──────────►│ RabbitMQ │
            │                 └──────────┘           └────┬─────┘
            │                                             │
            │                                             ▼
            │                                  ┌──────────────────────┐
            └─────────────────────────────────►│ Notification Service │
                                               │        :8083         │
                                               └──────────────────────┘
```

Each business service owns its own PostgreSQL database.

## Services

| Service | Port | Responsibility |
|---|---:|---|
| Core Service | 8080 | Authentication, users, vehicles and missions |
| Telemetry Service | 8081 | Telemetry ingestion, storage, SSE and Redis caching |
| Alert Service | 8082 | Telemetry rules and connection-loss detection |
| Notification Service | 8083 | User-specific alert notifications |
| Gateway Service | 8084 | API routing, circuit breakers and frontend entry point |

Infrastructure:

| Component | Purpose |
|---|---|
| PostgreSQL | Separate database per business service |
| RabbitMQ | Asynchronous event communication |
| Redis | Latest telemetry cache |
| Docker Compose | Local infrastructure and service orchestration |

## Main Features

- JWT-based authentication
- Role-based application security
- Vehicle management
- Mission management
- Vehicle telemetry ingestion
- Latest telemetry caching with Redis
- Database fallback when Redis is unavailable
- Server-Sent Events for real-time telemetry updates
- Low battery alert detection
- High temperature alert detection
- Vehicle connection-loss detection
- Automatic alert resolution
- RabbitMQ event-driven communication
- User-specific notification storage
- Unread notification count
- Mark notification as read
- API Gateway routing
- Resilience4j circuit breakers and fallback endpoints
- Flyway database migrations
- Dockerized Java services
- Docker Compose deployment

## Event Flow

A telemetry request follows this flow:

```text
Client
  │
  ▼
Gateway Service
  │
  ▼
Telemetry Service
  │
  ├──► PostgreSQL
  │
  ├──► Redis
  │
  └──► RabbitMQ
           │
           ▼
      Alert Service
           │
           ├── evaluates alert rules
           └── publishes alert.created
                         │
                         ▼
                    RabbitMQ
                         │
                         ▼
                Notification Service
                         │
                         ▼
                    PostgreSQL
```

Example:

```text
battery = 10%
      ↓
Telemetry Service
      ↓
telemetry.created
      ↓
Alert Service
      ↓
LOW_BATTERY
      ↓
alert.created
      ↓
Notification Service
      ↓
User notification
```

## Alert Rules

### Low Battery

A `LOW_BATTERY` alert is generated when:

```text
battery < 20
```

### High Temperature

A `HIGH_TEMPERATURE` alert is generated when:

```text
temperature > 70
```

### Connection Lost

The Alert Service periodically checks active vehicles.

If no recent telemetry is received for a vehicle, a:

```text
CONNECTION_LOST
```

alert is generated.

When new telemetry arrives, the existing connection-loss alert is automatically resolved.

## Redis Strategy

The latest telemetry value of a vehicle is stored in Redis.

The Telemetry Service first attempts to read from Redis.

```text
Redis available
    ↓
Return cached telemetry
```

If Redis cannot be reached within the configured timeout:

```text
Redis unavailable
    ↓
PostgreSQL fallback
```

This allows telemetry queries to continue working even when the cache is unavailable.

## Fault Tolerance

Gateway routes use Resilience4j circuit breakers for:

- Telemetry Service
- Alert Service
- Notification Service

When one of these services becomes unavailable, the Gateway uses a fallback endpoint instead of exposing an uncontrolled downstream error.

The telemetry SSE route is intentionally routed separately from the regular telemetry circuit breaker.

## Security

Authentication uses JWT.

The Core Service creates the JWT and the Notification Service validates the same token independently.

Internal service endpoints are protected using an internal API key.

Examples of internal communication:

```text
Telemetry Service → Core Service
Alert Service     → Core Service
Notification      → Core Service
```

Passwords and production secrets should not be committed to the repository.

## Database Architecture

The services use separate PostgreSQL databases:

```text
Core Service
└── mission_control

Telemetry Service
└── telemetry_service

Alert Service
└── alert_service

Notification Service
└── notification_service
```

Flyway manages database schema migrations.

The original monolithic telemetry, alert and notification tables were removed from the Core database after the microservice extraction was completed.

## Technology Stack

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- Spring Cloud Gateway MVC
- Resilience4j
- Flyway
- Maven

### Infrastructure

- PostgreSQL
- RabbitMQ
- Redis
- Docker
- Docker Compose

### Frontend

- React
- TypeScript
- Vite

## Running the Backend Stack

Requirements:

- Docker
- Docker Compose

Clone the repository and open the project root.

On Windows CMD:

```cmd
cd /d C:\path\to\mission-control
```

Set the required secrets:

```cmd
set JWT_SECRET=your-base64-jwt-secret
set INTERNAL_API_KEY=your-internal-api-key
```

Start the complete backend environment:

```cmd
docker compose up -d --build
```

Check containers:

```cmd
docker compose ps
```

The backend services will be available at:

```text
Core Service          http://localhost:8080
Telemetry Service     http://localhost:8081
Alert Service         http://localhost:8082
Notification Service  http://localhost:8083
Gateway Service       http://localhost:8084
RabbitMQ Management   http://localhost:15672
```

The frontend should normally communicate with:

```text
http://localhost:8084
```

## Running the Frontend

From the frontend directory:

```cmd
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

and sends API requests through the Gateway Service.

## Docker

All Java services use multi-stage Docker builds.

Build stage:

```text
Maven + Eclipse Temurin Java 21
```

Runtime stage:

```text
Eclipse Temurin Java 21 JRE
```

This keeps Maven and build dependencies outside the final runtime images.

## Verified End-to-End Flow

The Docker deployment has been tested with the following flow:

```text
POST telemetry through Gateway
        ↓
Telemetry persisted
        ↓
telemetry.created published
        ↓
Alert Service consumed event
        ↓
LOW_BATTERY alert created
        ↓
alert.created published
        ↓
Notification Service consumed event
        ↓
User notification created
```

Connection-loss resolution and high-temperature alert resolution were also verified after receiving fresh telemetry.

JWT-protected notification endpoints were tested through the Gateway.

## Project Evolution

The application was intentionally developed in stages.

```text
Modular Monolith
      ↓
Telemetry Service extraction
      ↓
Alert Service extraction
      ↓
Notification Service extraction
      ↓
RabbitMQ event communication
      ↓
API Gateway
      ↓
Resilience4j
      ↓
Redis caching
      ↓
Docker Compose deployment
```

This approach allowed each architectural change to be implemented and tested independently before removing the corresponding functionality from the original monolith.

## Status

Backend architecture and microservice communication are operational.

The complete backend stack can be started through Docker Compose and has been verified with an end-to-end telemetry → alert → notification scenario.