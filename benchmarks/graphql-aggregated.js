/**
 * k6 Load Test: GraphQL Aggregated Query
 *
 * Fetches the same data as the REST waterfall, but in a SINGLE GraphQL query:
 *   { user(id: X) { id username email fullName orders { id status totalAmount
 *       products { id name price } payment { id amount method status } } } }
 *
 * This demonstrates the key advantage of the Gateway Aggregation Pattern:
 *   - 1 HTTP round trip vs. N+1 in REST
 *   - Exact fields requested (no over-fetching)
 *   - Gateway handles the scatter-gather internally
 *
 * Usage:
 *   k6 run benchmarks/graphql-aggregated.js
 *   k6 run --vus 50 --duration 30s benchmarks/graphql-aggregated.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────
const graphqlQueryDuration = new Trend('graphql_query_total_ms', true);
const graphqlPayloadSize = new Trend('graphql_payload_bytes');
const graphqlErrors = new Rate('graphql_errors');
const graphqlRequests = new Counter('graphql_total_requests');

// ── Configuration ──────────────────────────────────────────
const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:8080/graphql';
const USER_IDS = [1, 2, 3];

// ── GraphQL Queries ────────────────────────────────────────

// Deep nested query: User + Orders + Products + Payment (same data as REST waterfall)
const USER_DEEP_QUERY = `
  query UserDeep($id: BigInteger!) {
    user(id: $id) {
      id
      username
      email
      fullName
      orders {
        id
        userId
        status
        totalAmount
        createdAt
        products {
          id
          name
          description
          price
          stockQuantity
          category
        }
        payment {
          id
          orderId
          amount
          method
          status
          processedAt
        }
      }
    }
  }
`;

// Simple single-service query (for baseline comparison)
const USERS_SIMPLE_QUERY = `
  query AllUsers {
    users {
      id
      username
      email
      fullName
    }
  }
`;

// Dashboard aggregation (3 root queries in one request)
const DASHBOARD_QUERY = `
  query Dashboard {
    users { id username email }
    products { id name price category }
    orders { id status totalAmount createdAt }
  }
`;

export const options = {
    scenarios: {
        // Scenario 1: Baseline (low load)
        baseline: {
            executor: 'constant-vus',
            vus: 10,
            duration: '30s',
            startTime: '0s',
            tags: { scenario: 'baseline' },
        },
        // Scenario 2: Moderate load
        moderate: {
            executor: 'constant-vus',
            vus: 50,
            duration: '30s',
            startTime: '35s',
            tags: { scenario: 'moderate' },
        },
        // Scenario 3: Stress test
        stress: {
            executor: 'constant-vus',
            vus: 100,
            duration: '30s',
            startTime: '70s',
            tags: { scenario: 'stress' },
        },
        // Scenario 4: Spike test
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 200 },
                { duration: '20s', target: 200 },
                { duration: '10s', target: 0 },
            ],
            startTime: '105s',
            tags: { scenario: 'spike' },
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        graphql_errors: ['rate<0.1'],
    },
};

function graphqlRequest(query, variables, tagName) {
    const payload = JSON.stringify({ query, variables });
    const params = {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: tagName },
    };

    const start = Date.now();
    const res = http.post(GATEWAY_URL, payload, params);
    const duration = Date.now() - start;

    graphqlRequests.add(1);
    graphqlQueryDuration.add(duration);
    graphqlPayloadSize.add(res.body.length);

    const ok = check(res, {
        'status is 200': (r) => r.status === 200,
        'no GraphQL errors': (r) => {
            const body = JSON.parse(r.body);
            return !body.errors || body.errors.length === 0;
        },
    });
    graphqlErrors.add(!ok);

    return res;
}

export default function () {
    const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];

    group('GraphQL: User + Orders + Products + Payments (single query)', function () {
        graphqlRequest(
            USER_DEEP_QUERY,
            { id: userId },
            'POST /graphql (UserDeep)'
        );
    });

    sleep(0.5);
}

// ── Alternative Test Functions ─────────────────────────────
// Run with: k6 run --exec simpleQuery benchmarks/graphql-aggregated.js

export function simpleQuery() {
    group('GraphQL: Simple Users Query (single service)', function () {
        graphqlRequest(USERS_SIMPLE_QUERY, {}, 'POST /graphql (AllUsers)');
    });
    sleep(0.5);
}

export function dashboardQuery() {
    group('GraphQL: Dashboard Aggregation (3 root queries)', function () {
        graphqlRequest(DASHBOARD_QUERY, {}, 'POST /graphql (Dashboard)');
    });
    sleep(0.5);
}

export function handleSummary(data) {
    const summary = {
        type: 'GraphQL Aggregated',
        timestamp: new Date().toISOString(),
        metrics: {},
    };

    const metricsOfInterest = [
        'graphql_query_total_ms',
        'graphql_payload_bytes',
        'graphql_total_requests',
        'http_req_duration',
        'http_reqs',
    ];

    for (const m of metricsOfInterest) {
        if (data.metrics[m]) {
            summary.metrics[m] = data.metrics[m].values;
        }
    }

    return {
        'benchmarks/results/graphql-aggregated-summary.json': JSON.stringify(summary, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, opts) {
    return '';
}
