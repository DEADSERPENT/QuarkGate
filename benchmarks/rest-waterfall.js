/**
 * k6 Load Test: REST Waterfall Pattern
 *
 * Simulates the traditional frontend "waterfall" approach:
 *   1. GET /users/1                    → User-Service
 *   2. GET /orders/user/1              → Order-Service
 *   3. For each order: GET /products/X → Product-Service (sequential per order)
 *   4. For each order: GET /payments/order/X → Payment-Service
 *
 * This is the N+1 problem — multiple sequential round trips to build the same
 * data that GraphQL can fetch in a single query.
 *
 * Usage:
 *   k6 run benchmarks/rest-waterfall.js
 *   k6 run --vus 50 --duration 30s benchmarks/rest-waterfall.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────
const totalWaterfallDuration = new Trend('rest_waterfall_total_ms', true);
const userCallDuration = new Trend('rest_user_call_ms', true);
const ordersCallDuration = new Trend('rest_orders_call_ms', true);
const productsCallDuration = new Trend('rest_products_scatter_ms', true);
const paymentCallDuration = new Trend('rest_payment_call_ms', true);
const totalPayloadSize = new Trend('rest_total_payload_bytes');
const httpErrors = new Rate('rest_http_errors');
const totalHttpCalls = new Counter('rest_total_http_calls');

// ── Configuration ──────────────────────────────────────────
const BASE_URLS = {
    user:    __ENV.USER_URL    || 'http://localhost:8081',
    product: __ENV.PRODUCT_URL || 'http://localhost:8082',
    order:   __ENV.ORDER_URL   || 'http://localhost:8083',
    payment: __ENV.PAYMENT_URL || 'http://localhost:8084',
};

// Seed data: users 1-3, orders 1-4, products 1-5
const USER_IDS = [1, 2, 3];

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
        rest_http_errors: ['rate<0.1'],
    },
};

export default function () {
    const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
    const waterfallStart = Date.now();
    let totalBytes = 0;

    group('REST Waterfall: User + Orders + Products + Payments', function () {
        // Step 1: Fetch user
        const userRes = http.get(`${BASE_URLS.user}/users/${userId}`, {
            tags: { name: 'GET /users/:id' },
        });
        totalHttpCalls.add(1);
        userCallDuration.add(userRes.timings.duration);
        totalBytes += userRes.body.length;
        const userOk = check(userRes, {
            'user: status 200': (r) => r.status === 200,
        });
        httpErrors.add(!userOk);

        // Step 2: Fetch orders for this user
        const ordersRes = http.get(`${BASE_URLS.order}/orders/user/${userId}`, {
            tags: { name: 'GET /orders/user/:id' },
        });
        totalHttpCalls.add(1);
        ordersCallDuration.add(ordersRes.timings.duration);
        totalBytes += ordersRes.body.length;
        const ordersOk = check(ordersRes, {
            'orders: status 200': (r) => r.status === 200,
        });
        httpErrors.add(!ordersOk);

        if (ordersRes.status !== 200) return;

        const orders = JSON.parse(ordersRes.body);

        // Step 3 & 4: For each order, fetch products and payment (sequential — the waterfall)
        for (const order of orders) {
            // Fetch products for this order (one by one — simulating REST N+1)
            if (order.productIds && order.productIds.length > 0) {
                const productStart = Date.now();
                for (const productId of order.productIds) {
                    const prodRes = http.get(`${BASE_URLS.product}/products/${productId}`, {
                        tags: { name: 'GET /products/:id' },
                    });
                    totalHttpCalls.add(1);
                    totalBytes += prodRes.body.length;
                    const prodOk = check(prodRes, {
                        'product: status 200': (r) => r.status === 200,
                    });
                    httpErrors.add(!prodOk);
                }
                productsCallDuration.add(Date.now() - productStart);
            }

            // Fetch payment for this order
            const payRes = http.get(`${BASE_URLS.payment}/payments/order/${order.id}`, {
                tags: { name: 'GET /payments/order/:id' },
            });
            totalHttpCalls.add(1);
            paymentCallDuration.add(payRes.timings.duration);
            totalBytes += payRes.body.length;
            const payOk = check(payRes, {
                'payment: status 200': (r) => r.status === 200,
            });
            httpErrors.add(!payOk);
        }
    });

    const waterfallEnd = Date.now();
    totalWaterfallDuration.add(waterfallEnd - waterfallStart);
    totalPayloadSize.add(totalBytes);

    sleep(0.5);
}

export function handleSummary(data) {
    const summary = {
        type: 'REST Waterfall',
        timestamp: new Date().toISOString(),
        metrics: {},
    };

    const metricsOfInterest = [
        'rest_waterfall_total_ms',
        'rest_user_call_ms',
        'rest_orders_call_ms',
        'rest_products_scatter_ms',
        'rest_payment_call_ms',
        'rest_total_payload_bytes',
        'rest_total_http_calls',
        'http_req_duration',
        'http_reqs',
    ];

    for (const m of metricsOfInterest) {
        if (data.metrics[m]) {
            summary.metrics[m] = data.metrics[m].values;
        }
    }

    return {
        'benchmarks/results/rest-waterfall-summary.json': JSON.stringify(summary, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, opts) {
    // k6 built-in text summary
    return '';
}
