/**
 * k6 Load Test: Side-by-Side Comparison
 *
 * Runs BOTH the REST waterfall and GraphQL aggregated approaches in the
 * same test, with separate scenarios, so results are directly comparable.
 *
 * Usage:
 *   k6 run benchmarks/comparison.js
 *
 * This produces a single report with metrics tagged by approach:
 *   - rest_* metrics for the waterfall pattern
 *   - graphql_* metrics for the aggregated pattern
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────
// REST metrics
const restTotalDuration = new Trend('rest_total_duration_ms', true);
const restPayloadSize = new Trend('rest_payload_bytes');
const restHttpCalls = new Counter('rest_http_call_count');
const restErrors = new Rate('rest_error_rate');

// GraphQL metrics
const gqlTotalDuration = new Trend('gql_total_duration_ms', true);
const gqlPayloadSize = new Trend('gql_payload_bytes');
const gqlHttpCalls = new Counter('gql_http_call_count');
const gqlErrors = new Rate('gql_error_rate');

// ── Configuration ──────────────────────────────────────────
const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:8080/graphql';
const BASE_URLS = {
    user:    __ENV.USER_URL    || 'http://localhost:8081',
    product: __ENV.PRODUCT_URL || 'http://localhost:8082',
    order:   __ENV.ORDER_URL   || 'http://localhost:8083',
    payment: __ENV.PAYMENT_URL || 'http://localhost:8084',
};
const USER_IDS = [1, 2, 3];

const USER_DEEP_QUERY = `
  query UserDeep($id: BigInteger!) {
    user(id: $id) {
      id username email fullName
      orders {
        id userId status totalAmount createdAt
        products { id name description price stockQuantity category }
        payment { id orderId amount method status processedAt }
      }
    }
  }
`;

export const options = {
    scenarios: {
        rest_baseline: {
            executor: 'constant-vus',
            exec: 'restWaterfall',
            vus: 10,
            duration: '30s',
            startTime: '0s',
            tags: { approach: 'REST', load: 'baseline' },
        },
        gql_baseline: {
            executor: 'constant-vus',
            exec: 'graphqlAggregated',
            vus: 10,
            duration: '30s',
            startTime: '0s',
            tags: { approach: 'GraphQL', load: 'baseline' },
        },
        rest_moderate: {
            executor: 'constant-vus',
            exec: 'restWaterfall',
            vus: 50,
            duration: '30s',
            startTime: '35s',
            tags: { approach: 'REST', load: 'moderate' },
        },
        gql_moderate: {
            executor: 'constant-vus',
            exec: 'graphqlAggregated',
            vus: 50,
            duration: '30s',
            startTime: '35s',
            tags: { approach: 'GraphQL', load: 'moderate' },
        },
        rest_stress: {
            executor: 'constant-vus',
            exec: 'restWaterfall',
            vus: 100,
            duration: '30s',
            startTime: '70s',
            tags: { approach: 'REST', load: 'stress' },
        },
        gql_stress: {
            executor: 'constant-vus',
            exec: 'graphqlAggregated',
            vus: 100,
            duration: '30s',
            startTime: '70s',
            tags: { approach: 'GraphQL', load: 'stress' },
        },
    },
    thresholds: {
        rest_error_rate: ['rate<0.1'],
        gql_error_rate: ['rate<0.1'],
    },
};

// ── REST Waterfall ─────────────────────────────────────────
export function restWaterfall() {
    const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
    const start = Date.now();
    let totalBytes = 0;
    let callCount = 0;
    let hasError = false;

    group('REST: User + Orders + Products + Payments', function () {
        // 1. Fetch user
        const userRes = http.get(`${BASE_URLS.user}/users/${userId}`, {
            tags: { name: 'REST GET /users/:id' },
        });
        callCount++;
        totalBytes += userRes.body.length;
        if (userRes.status !== 200) hasError = true;

        // 2. Fetch orders
        const ordersRes = http.get(`${BASE_URLS.order}/orders/user/${userId}`, {
            tags: { name: 'REST GET /orders/user/:id' },
        });
        callCount++;
        totalBytes += ordersRes.body.length;
        if (ordersRes.status !== 200) { hasError = true; return; }

        const orders = JSON.parse(ordersRes.body);

        // 3. For each order, fetch products + payment
        for (const order of orders) {
            if (order.productIds) {
                for (const pid of order.productIds) {
                    const pRes = http.get(`${BASE_URLS.product}/products/${pid}`, {
                        tags: { name: 'REST GET /products/:id' },
                    });
                    callCount++;
                    totalBytes += pRes.body.length;
                    if (pRes.status !== 200) hasError = true;
                }
            }
            const payRes = http.get(`${BASE_URLS.payment}/payments/order/${order.id}`, {
                tags: { name: 'REST GET /payments/order/:id' },
            });
            callCount++;
            totalBytes += payRes.body.length;
            if (payRes.status !== 200) hasError = true;
        }
    });

    restTotalDuration.add(Date.now() - start);
    restPayloadSize.add(totalBytes);
    restHttpCalls.add(callCount);
    restErrors.add(hasError);

    sleep(0.5);
}

// ── GraphQL Aggregated ─────────────────────────────────────
export function graphqlAggregated() {
    const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];

    group('GraphQL: User + Orders + Products + Payments', function () {
        const payload = JSON.stringify({
            query: USER_DEEP_QUERY,
            variables: { id: userId },
        });

        const start = Date.now();
        const res = http.post(GATEWAY_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'GQL POST /graphql (UserDeep)' },
        });
        const duration = Date.now() - start;

        gqlTotalDuration.add(duration);
        gqlPayloadSize.add(res.body.length);
        gqlHttpCalls.add(1);

        let hasError = res.status !== 200;
        if (!hasError) {
            const body = JSON.parse(res.body);
            hasError = !!(body.errors && body.errors.length > 0);
        }
        gqlErrors.add(hasError);

        check(res, {
            'GraphQL: status 200': (r) => r.status === 200,
            'GraphQL: no errors': (r) => {
                const b = JSON.parse(r.body);
                return !b.errors || b.errors.length === 0;
            },
        });
    });

    sleep(0.5);
}

export function handleSummary(data) {
    const extractMetric = (name) => data.metrics[name] ? data.metrics[name].values : null;

    const summary = {
        type: 'REST vs GraphQL Comparison',
        timestamp: new Date().toISOString(),
        rest: {
            total_duration_ms: extractMetric('rest_total_duration_ms'),
            payload_bytes: extractMetric('rest_payload_bytes'),
            http_call_count: extractMetric('rest_http_call_count'),
            error_rate: extractMetric('rest_error_rate'),
        },
        graphql: {
            total_duration_ms: extractMetric('gql_total_duration_ms'),
            payload_bytes: extractMetric('gql_payload_bytes'),
            http_call_count: extractMetric('gql_http_call_count'),
            error_rate: extractMetric('gql_error_rate'),
        },
    };

    return {
        'benchmarks/results/comparison-summary.json': JSON.stringify(summary, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, opts) {
    return '';
}
