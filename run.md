# QuarkGate - Run Guide

## Prerequisites

- Java 17+
- Maven (wrapper included)
- Docker Desktop (running)
- Node.js 18+ (for frontend)

## Architecture

| Service              | Port | Database        |
|----------------------|------|-----------------|
| GraphQL Gateway      | 8080 | Redis (cache)   |
| User Service         | 8081 | PostgreSQL:5432 |
| Product Service      | 8082 | PostgreSQL:5433 |
| Order Service        | 8083 | PostgreSQL:5434 |
| Payment Service      | 8084 | PostgreSQL:5435 |
| Kafka                | 29092| -               |
| Jaeger UI            | 16686| -               |
| Keycloak             | 8180 | -               |
| Frontend (Vite)      | 5173 | -               |

---

## Option 1: Docker Compose (easiest)

### Step 1 - Build all services

```bash
./mvnw package -DskipTests
```

### Step 2 - Start everything (4 DBs + Redis + Kafka + Jaeger + Keycloak + 5 services)

```bash
docker compose up --build
```

Wait until all services are healthy, then open http://localhost:5173.

### Step 3 - Start frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

---

## Option 2: Local dev (with Quarkus live reload)

### Step 1 - Start infrastructure only

```bash
docker compose up user-db product-db order-db payment-db redis kafka zookeeper jaeger keycloak
```

### Step 2 - Run each service in dev mode (5 separate terminals)

```bash
# Terminal 1: User Service (port 8081)
cd user-service && ./mvnw quarkus:dev

# Terminal 2: Product Service (port 8082)
cd product-service && ./mvnw quarkus:dev

# Terminal 3: Order Service (port 8083)
cd order-service && ./mvnw quarkus:dev

# Terminal 4: Payment Service (port 8084)
cd payment-service && ./mvnw quarkus:dev

# Terminal 5: GraphQL Gateway (port 8080)
cd graphql-gateway-service && ./mvnw quarkus:dev
```

### Step 3 - Start frontend (6th terminal)

```bash
cd frontend
npm install
npm run dev
```

---

## Endpoints

- **Frontend:** http://localhost:5173
- **GraphQL Playground:** http://localhost:8080/q/graphql-ui
- **Jaeger Tracing:** http://localhost:16686
- **Keycloak Admin:** http://localhost:8180 (admin/admin)

## Stopping

```bash
docker compose down        # stop containers
docker compose down -v     # stop & remove volumes (resets DBs)
```
