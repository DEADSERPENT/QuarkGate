# QuarkGate Kubernetes Deployment

Production-grade Kubernetes manifests for the QuarkGate microservices architecture.

## Architecture

```
                    ┌─────────────────┐
                    │   Ingress       │
                    │ (NGINX)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ GraphQL Gateway │ ◄── HPA (2-8 replicas)
                    │   (port 8080)   │
                    └────────┬────────┘
           ┌─────────┬──────┴──────┬─────────┐
    ┌──────▼──┐ ┌────▼───┐ ┌──────▼──┐ ┌────▼─────┐
    │  User   │ │Product │ │  Order  │ │ Payment  │  ◄── HPA (2-5 each)
    │ Service │ │Service │ │ Service │ │ Service  │
    └────┬────┘ └───┬────┘ └────┬────┘ └────┬─────┘
    ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌────▼─────┐
    │User DB  │ │Prod DB │ │Order DB│ │Payment DB│
    └─────────┘ └────────┘ └───┬────┘ └────┬─────┘
                               │            │
                          ┌────▼────────────▼────┐
                          │      Kafka           │
                          └──────────────────────┘
```

## Prerequisites

- Kubernetes cluster (Minikube, Docker Desktop, or cloud)
- `kubectl` configured
- Container images built and accessible

## Quick Start

```bash
# Deploy everything
./k8s/deploy.sh all

# Check status
./k8s/deploy.sh status

# Teardown
./k8s/deploy.sh teardown
```

## Step-by-Step Deployment

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Deploy infrastructure (databases, Redis, Kafka, Jaeger, Keycloak)
kubectl apply -f k8s/infrastructure/

# 3. Wait for infra to be ready, then deploy services
kubectl apply -f k8s/base/services.yaml

# 4. Apply autoscaling and ingress
kubectl apply -f k8s/base/hpa.yaml
kubectl apply -f k8s/base/ingress.yaml
```

## File Structure

```
k8s/
├── namespace.yaml                  # quarkgate namespace
├── deploy.sh                       # Deployment automation script
├── README.md
├── infrastructure/
│   ├── postgres.yaml               # 4 PostgreSQL instances
│   ├── redis.yaml                  # Redis cache
│   ├── kafka.yaml                  # Zookeeper + Kafka broker
│   ├── jaeger.yaml                 # Distributed tracing
│   └── keycloak.yaml               # Identity provider (OIDC)
└── base/
    ├── services.yaml               # 5 microservice deployments + services
    ├── hpa.yaml                    # Horizontal Pod Autoscalers
    └── ingress.yaml                # NGINX Ingress routes
```

## Scaling

The HPA configuration automatically scales services based on CPU utilization:

| Service | Min Replicas | Max Replicas | CPU Target |
|---------|:---:|:---:|:---:|
| GraphQL Gateway | 2 | 8 | 60% |
| User Service | 2 | 5 | 70% |
| Product Service | 2 | 5 | 70% |
| Order Service | 2 | 5 | 70% |
| Payment Service | 2 | 5 | 70% |

## Ingress Routes

| Host | Path | Service |
|------|------|---------|
| api.quarkgate.local | /graphql | GraphQL Gateway |
| jaeger.quarkgate.local | / | Jaeger UI |
| auth.quarkgate.local | / | Keycloak |

For local development with Minikube, add entries to `/etc/hosts`:
```
<minikube-ip> api.quarkgate.local jaeger.quarkgate.local auth.quarkgate.local
```

## Resource Limits

Each microservice is configured with:
- **Requests:** 200m CPU, 256Mi memory
- **Limits:** 500m CPU, 512Mi memory
- **Gateway:** Higher limits (300m/384Mi requests, 750m/768Mi limits)

## Health Checks

All services expose Quarkus health endpoints:
- **Readiness:** `/q/health/ready` — used by K8s to route traffic
- **Liveness:** `/q/health/live` — used by K8s to restart unhealthy pods
