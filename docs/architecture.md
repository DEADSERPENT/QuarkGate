# QuarkGate — Architecture Documentation

**M.Tech Thesis: GraphQL Gateway Aggregation Pattern for Microservices**

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        FE["React Dashboard<br/>(Apollo Client)"]
    end

    subgraph Gateway["API Gateway Layer"]
        GQL["GraphQL Gateway<br/>(Quarkus + SmallRye GraphQL)"]
        CACHE["Redis Cache<br/>(60s/120s TTL)"]
        FT["Fault Tolerance<br/>(Circuit Breaker + Retry)"]
    end

    subgraph Services["Microservices Layer"]
        US["User Service<br/>:8081"]
        PS["Product Service<br/>:8082"]
        OS["Order Service<br/>:8083"]
        PMS["Payment Service<br/>:8084"]
    end

    subgraph Data["Data Layer"]
        UDB[("User DB<br/>PostgreSQL")]
        PDB[("Product DB<br/>PostgreSQL")]
        ODB[("Order DB<br/>PostgreSQL")]
        PMDB[("Payment DB<br/>PostgreSQL")]
    end

    subgraph Infrastructure["Infrastructure"]
        KC["Keycloak<br/>(OIDC/JWT)"]
        KF["Apache Kafka<br/>(Event Streaming)"]
        JG["Jaeger<br/>(Distributed Tracing)"]
    end

    FE -->|"GraphQL over HTTP"| GQL
    GQL --> CACHE
    GQL --> FT
    GQL -->|"REST Client"| US
    GQL -->|"REST Client"| PS
    GQL -->|"REST Client"| OS
    GQL -->|"REST Client"| PMS

    US --> UDB
    PS --> PDB
    OS --> ODB
    PMS --> PMDB

    OS -->|"Publish: OrderCreatedEvent"| KF
    KF -->|"Consume: OrderCreatedEvent"| PMS

    FE -->|"OIDC Auth"| KC
    GQL -->|"JWT Validation"| KC

    US -.->|"OpenTelemetry"| JG
    PS -.->|"OpenTelemetry"| JG
    OS -.->|"OpenTelemetry"| JG
    PMS -.->|"OpenTelemetry"| JG
    GQL -.->|"OpenTelemetry"| JG

    style Gateway fill:#e0f2fe,stroke:#0284c7
    style Services fill:#f0fdf4,stroke:#16a34a
    style Data fill:#fef3c7,stroke:#d97706
    style Infrastructure fill:#fae8ff,stroke:#a855f7
    style Client fill:#f1f5f9,stroke:#475569
```

---

## 2. REST Waterfall vs GraphQL Aggregation

### 2.1 REST Waterfall Pattern (Problem)

```mermaid
sequenceDiagram
    participant C as Client
    participant US as User Service
    participant OS as Order Service
    participant PS as Product Service
    participant PMS as Payment Service

    Note over C: Sequential N+1 HTTP calls
    C->>+US: GET /users/1
    US-->>-C: User data

    C->>+OS: GET /orders/user/1
    OS-->>-C: [Order 1, Order 2]

    loop For each order
        loop For each productId
            C->>+PS: GET /products/{id}
            PS-->>-C: Product data
        end
        C->>+PMS: GET /payments/order/{id}
        PMS-->>-C: Payment data
    end

    Note over C: Total: 5-9+ HTTP round trips<br/>High latency, over-fetching
```

### 2.2 GraphQL Gateway Aggregation (Solution)

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as GraphQL Gateway
    participant US as User Service
    participant OS as Order Service
    participant PS as Product Service
    participant PMS as Payment Service

    Note over C: Single GraphQL query
    C->>+GW: POST /graphql<br/>{ user(id:1) { orders { products, payment } } }

    par Scatter-Gather (parallel)
        GW->>+US: GET /users/1
        US-->>-GW: User data
        GW->>+OS: GET /orders/user/1
        OS-->>-GW: [Order 1, Order 2]
    end

    par Nested resolution (parallel)
        GW->>+PS: GET /products/1
        GW->>+PS: GET /products/2
        GW->>+PS: GET /products/3
        PS-->>-GW: Product 1
        PS-->>-GW: Product 2
        PS-->>-GW: Product 3
        GW->>+PMS: GET /payments/order/1
        GW->>+PMS: GET /payments/order/2
        PMS-->>-GW: Payment 1
        PMS-->>-GW: Payment 2
    end

    GW-->>-C: Single aggregated JSON response

    Note over C: Total: 1 HTTP round trip from client<br/>Exact fields, no over-fetching
```

---

## 3. Kafka Event-Driven Architecture

```mermaid
graph LR
    subgraph OrderService["Order Service"]
        OC["OrderResource<br/>(POST /orders)"]
        OP["OrderEventProducer"]
    end

    subgraph Kafka["Apache Kafka"]
        T["Topic:<br/>order-events"]
        DLQ["Dead Letter Queue"]
    end

    subgraph PaymentService["Payment Service"]
        PC["OrderEventConsumer"]
        PE["PaymentEntity"]
    end

    OC -->|"1. Create Order"| OP
    OP -->|"2. Publish OrderCreatedEvent"| T
    T -->|"3. Consume Event"| PC
    PC -->|"4. Create Payment<br/>(status=PENDING, method=CARD)"| PE
    PC -.->|"On failure"| DLQ

    style Kafka fill:#fef3c7,stroke:#d97706
    style OrderService fill:#e0f2fe,stroke:#0284c7
    style PaymentService fill:#f0fdf4,stroke:#16a34a
```

### Event Payload: OrderCreatedEvent
```json
{
    "orderId": 5,
    "userId": 1,
    "totalAmount": 99.99,
    "status": "PENDING",
    "createdAt": "2026-02-16T12:00:00",
    "productIds": [1, 2]
}
```

**Key Design Decisions:**
- **Idempotent Consumer:** Payment service checks if payment already exists for an orderId before creating
- **Dead Letter Queue:** Failed events are routed to DLQ for manual inspection
- **Asynchronous Processing:** Order creation returns immediately; payment is created asynchronously

---

## 4. Keycloak Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant KC as Keycloak
    participant GW as GraphQL Gateway
    participant SVC as Downstream Service

    U->>FE: Access Dashboard
    FE->>KC: Redirect to login page
    U->>KC: Enter credentials
    KC-->>FE: JWT Access Token + Refresh Token

    FE->>GW: POST /graphql<br/>Authorization: Bearer {JWT}
    GW->>KC: Validate JWT signature & claims

    alt Token valid
        GW->>SVC: Forward request<br/>(AuthHeaderPropagationFilter)
        SVC-->>GW: Response
        GW-->>FE: GraphQL response
    else Token expired/invalid
        GW-->>FE: 401 Unauthorized
        FE->>KC: Refresh token
        KC-->>FE: New JWT
    end
```

**OIDC Configuration:**
- **Realm:** `quarkgate`
- **Client ID:** Configured in Keycloak admin console
- **Token Propagation:** `AuthHeaderPropagationFilter` forwards JWT from gateway to downstream services
- **Public Endpoints:** `/graphql`, `/q/*` (health, metrics) are accessible without authentication

---

## 5. Distributed Tracing with Jaeger

```mermaid
graph TB
    subgraph TraceSpan["Trace: User Dashboard Query"]
        S1["Span 1: GraphQL Gateway<br/>POST /graphql (45ms)"]
        S2["Span 2: User Service<br/>GET /users/1 (8ms)"]
        S3["Span 3: Order Service<br/>GET /orders/user/1 (10ms)"]
        S4["Span 4: Product Service<br/>GET /products/1 (5ms)"]
        S5["Span 5: Product Service<br/>GET /products/2 (6ms)"]
        S6["Span 6: Payment Service<br/>GET /payments/order/1 (7ms)"]
    end

    S1 --> S2
    S1 --> S3
    S1 --> S4
    S1 --> S5
    S1 --> S6

    JG["Jaeger UI<br/>http://localhost:16686"]
    S1 -.->|"OTLP/gRPC :4317"| JG

    style TraceSpan fill:#f0fdf4,stroke:#16a34a
```

**OpenTelemetry Configuration:**
- **Protocol:** OTLP over gRPC (port 4317)
- **Sampling:** Always-on (100%) for development/thesis evaluation
- **Propagation:** W3C TraceContext headers propagated across all services
- **Visualization:** Jaeger UI shows complete request waterfall with timing breakdown

---

## 6. Redis Caching Strategy

```mermaid
graph LR
    subgraph Gateway["GraphQL Gateway"]
        R["Resolver<br/>@CacheResult"]
    end

    subgraph Redis["Redis 7"]
        UC["users-cache<br/>(TTL: 60s)"]
        UIC["user-cache<br/>(TTL: 120s)"]
        PC["products-cache<br/>(TTL: 60s)"]
        PIC["product-cache<br/>(TTL: 120s)"]
    end

    subgraph Services["Downstream"]
        US["User Service"]
        PS["Product Service"]
    end

    R -->|"Cache HIT"| UC
    R -->|"Cache HIT"| PIC
    R -->|"Cache MISS"| US
    R -->|"Cache MISS"| PS
    US -->|"Populate"| UC
    PS -->|"Populate"| PIC

    style Redis fill:#fef3c7,stroke:#d97706
```

| Cache Name | TTL | What's Cached |
|:--|:--:|:--|
| `users-cache` | 60s | List of all users |
| `user-cache` | 120s | Individual user by ID |
| `products-cache` | 60s | List of all products |
| `product-cache` | 120s | Individual product by ID |

---

## 7. Fault Tolerance Pattern

```mermaid
stateDiagram-v2
    [*] --> Closed: Normal operation
    Closed --> Open: 50% failure rate<br/>(10+ requests)
    Open --> HalfOpen: After 10s delay
    HalfOpen --> Closed: Request succeeds
    HalfOpen --> Open: Request fails
    Open --> Open: Reject requests<br/>(return fallback)
```

**Configuration per Resolver:**
| Parameter | Value | Purpose |
|:--|:--:|:--|
| Timeout | 5000ms | Prevent hanging requests |
| Retry | 3 attempts, 200ms delay | Handle transient failures |
| Circuit Breaker threshold | 10 requests | Minimum sample size |
| Failure ratio | 50% | Trip threshold |
| Recovery delay | 10s | Cool-down period |
| Fallback | Empty list / null | Graceful degradation |

---

## 8. Technology Stack Summary

| Layer | Technology | Version | Purpose |
|:--|:--|:--:|:--|
| **Frontend** | React + Vite | 19.2 / 7.3 | Single-page dashboard |
| **GraphQL Client** | Apollo Client | 4.1 | GraphQL queries + cache |
| **API Gateway** | Quarkus + SmallRye GraphQL | 3.17.2 | Query aggregation |
| **Microservices** | Quarkus (REST) | 3.17.2 | Domain services |
| **Database** | PostgreSQL | 16 | Per-service data store |
| **Cache** | Redis | 7 | Distributed caching |
| **Messaging** | Apache Kafka | 7.5 (Confluent) | Event streaming |
| **Identity** | Keycloak | 23.0 | OIDC / JWT auth |
| **Tracing** | Jaeger + OpenTelemetry | 1.62 | Distributed tracing |
| **Testing** | JUnit 5 + REST-assured + Vitest | - | Backend + frontend tests |
| **Load Testing** | k6 (Grafana) | - | Performance benchmarks |
| **Containers** | Docker + Docker Compose | - | Local orchestration |
| **Orchestration** | Kubernetes | - | Production deployment |
