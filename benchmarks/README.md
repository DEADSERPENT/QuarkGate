# QURACUS Performance Benchmarks

Performance analysis of **GraphQL Gateway aggregation** vs **REST waterfall** pattern
using [k6](https://k6.io/) load testing.

## Prerequisites

1. **k6** installed:
   ```bash
   # Windows
   winget install grafana.k6

   # macOS
   brew install k6

   # Linux
   snap install k6
   ```

2. **All services running** (Docker Compose or local dev):
   ```bash
   docker-compose up --build
   ```

3. **Jaeger UI** available at http://localhost:16686 for trace visualization.

## Test Scripts

| Script | What it Tests | Approach |
|--------|--------------|----------|
| `rest-waterfall.js` | Sequential REST calls (N+1 pattern) | User → Orders → Products → Payments |
| `graphql-aggregated.js` | Single GraphQL query (gateway aggregation) | One POST with nested fields |
| `comparison.js` | Both approaches side-by-side | REST and GraphQL in parallel scenarios |
| `cache-impact.js` | Redis cache cold vs warm performance | Cold → Warm → Stress → Mixed load |
| `generate-report.js` | HTML report generator | Reads JSON results, produces Chart.js report |

## Quick Start

```bash
# Quick smoke test (10 VUs, 10 seconds)
run-benchmarks.bat quick

# Full benchmark suite (baseline → moderate → stress → spike)
run-benchmarks.bat all

# Individual tests
run-benchmarks.bat rest
run-benchmarks.bat graphql
run-benchmarks.bat comparison
run-benchmarks.bat cache

# Generate HTML report from results
node benchmarks/generate-report.js
```

Or run k6 directly:

```bash
# Single quick run
k6 run --vus 10 --duration 10s benchmarks/graphql-aggregated.js

# Full scenario suite
k6 run benchmarks/comparison.js
```

## Load Scenarios

Each test runs through 4 stages:

| Stage | VUs | Duration | Purpose |
|-------|-----|----------|---------|
| Baseline | 10 | 30s | Establish baseline latency |
| Moderate | 50 | 30s | Normal production load |
| Stress | 100 | 30s | High load behavior |
| Spike | 0→200→0 | 40s | Burst traffic resilience |

## What Gets Measured

### REST Waterfall Metrics
- `rest_waterfall_total_ms` — Total time for the full waterfall sequence
- `rest_user_call_ms` — Time for GET /users/:id
- `rest_orders_call_ms` — Time for GET /orders/user/:id
- `rest_products_scatter_ms` — Time for all product fetches per order
- `rest_payment_call_ms` — Time for GET /payments/order/:id
- `rest_total_payload_bytes` — Total bytes transferred across all calls
- `rest_total_http_calls` — Number of HTTP requests per iteration

### GraphQL Aggregated Metrics
- `graphql_query_total_ms` — Time for the single GraphQL query
- `graphql_payload_bytes` — Response payload size
- `graphql_total_requests` — Always 1 per iteration

### Comparison Metrics
- `rest_total_duration_ms` vs `gql_total_duration_ms` — Direct latency comparison
- `rest_payload_bytes` vs `gql_payload_bytes` — Payload size comparison
- `rest_http_call_count` vs `gql_http_call_count` — Round-trip comparison

## Expected Data Flow

### REST Waterfall (for User 1)
```
Client → GET /users/1                    → User-Service     (1 call)
Client → GET /orders/user/1              → Order-Service    (1 call)
Client → GET /products/1                 → Product-Service  (1 call)
Client → GET /products/2                 → Product-Service  (1 call)
Client → GET /payments/order/1           → Payment-Service  (1 call)
Client → GET /products/3                 → Product-Service  (1 call)
Client → GET /payments/order/2           → Payment-Service  (1 call)
                                                    Total: 7 HTTP calls
```

### GraphQL Aggregated (for User 1)
```
Client → POST /graphql { user(id:1) { orders { products, payment } } }
         ↓ Gateway internally:
         ├→ User-Service   (1 call)
         ├→ Order-Service  (1 call)
         ├→ Product-Service (scatter: 3 calls in parallel)
         └→ Payment-Service (2 calls)
Client ← Single JSON response
                                                    Total: 1 HTTP call from client
```

## Interpreting Results

After running, check:

1. **k6 console output** — p50, p95, p99 latency, throughput (req/s)
2. **JSON summaries** in `results/` directory
3. **Jaeger traces** at http://localhost:16686 — visual proof of the gateway fan-out

### Key Thesis Metrics

| Metric | REST Expected | GraphQL Expected | Why |
|--------|--------------|------------------|-----|
| Client round trips | 5-9 per user | 1 | Gateway handles fan-out |
| Total latency | Sum of sequential calls | Max of parallel calls | Scatter-gather |
| Payload size | Larger (over-fetching) | Exact fields only | GraphQL projection |
| Under load (p95) | Degrades faster | More stable | Fewer connections |

## Environment Variables

Override service URLs for Docker or remote testing:

```bash
k6 run -e GATEWAY_URL=http://gateway:8080/graphql benchmarks/graphql-aggregated.js

k6 run -e USER_URL=http://user:8081 \
       -e ORDER_URL=http://order:8083 \
       -e PRODUCT_URL=http://product:8082 \
       -e PAYMENT_URL=http://payment:8084 \
       benchmarks/rest-waterfall.js
```
