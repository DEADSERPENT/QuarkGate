/**
 * k6 Load Test: Redis Cache Impact Analysis
 *
 * Tests the GraphQL gateway with cold cache vs warm cache to demonstrate
 * how Redis caching improves response times under load.
 *
 * Scenario flow:
 *   1. Cold cache phase — first requests populate the cache
 *   2. Warm cache phase — subsequent requests hit Redis cache
 *   3. Mixed load phase — realistic mix of cached/uncached queries
 *
 * Usage:
 *   k6 run benchmarks/cache-impact.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────
const coldCacheDuration = new Trend('cold_cache_duration_ms', true);
const warmCacheDuration = new Trend('warm_cache_duration_ms', true);
const mixedCacheDuration = new Trend('mixed_cache_duration_ms', true);
const cacheErrors = new Rate('cache_test_errors');
const cacheRequests = new Counter('cache_total_requests');

// ── Configuration ──────────────────────────────────────────
const GATEWAY_URL = __ENV.GATEWAY_URL || 'http://localhost:8080/graphql';
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

const DASHBOARD_QUERY = `
  query Dashboard {
    users { id username email fullName }
    products { id name price category stockQuantity }
    orders { id status totalAmount createdAt }
  }
`;

const PRODUCTS_QUERY = `
  query AllProducts {
    products { id name description price category stockQuantity }
  }
`;

export const options = {
    scenarios: {
        // Phase 1: Cold cache — no data cached yet, all requests hit downstream services
        cold_cache: {
            executor: 'per-vu-iterations',
            exec: 'coldCachePhase',
            vus: 10,
            iterations: 3,
            startTime: '0s',
            tags: { phase: 'cold_cache' },
        },
        // Phase 2: Warm cache — same queries again, should hit Redis
        warm_cache: {
            executor: 'constant-vus',
            exec: 'warmCachePhase',
            vus: 30,
            duration: '30s',
            startTime: '15s',
            tags: { phase: 'warm_cache' },
        },
        // Phase 3: High load with warm cache
        warm_cache_stress: {
            executor: 'constant-vus',
            exec: 'warmCachePhase',
            vus: 100,
            duration: '30s',
            startTime: '50s',
            tags: { phase: 'warm_cache_stress' },
        },
        // Phase 4: Mixed — different user IDs, some cached some not
        mixed_load: {
            executor: 'ramping-vus',
            exec: 'mixedPhase',
            startVUs: 10,
            stages: [
                { duration: '15s', target: 80 },
                { duration: '15s', target: 80 },
                { duration: '10s', target: 0 },
            ],
            startTime: '85s',
            tags: { phase: 'mixed' },
        },
    },
    thresholds: {
        cache_test_errors: ['rate<0.15'],
        warm_cache_duration_ms: ['p(95)<500'],
    },
};

function executeGraphQL(query, variables, metricTrend, tagName) {
    const payload = JSON.stringify({ query, variables });
    const start = Date.now();
    const res = http.post(GATEWAY_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: tagName },
    });
    const duration = Date.now() - start;

    metricTrend.add(duration);
    cacheRequests.add(1);

    let hasError = res.status !== 200;
    if (!hasError) {
        try {
            const body = JSON.parse(res.body);
            hasError = !!(body.errors && body.errors.length > 0);
        } catch (e) {
            hasError = true;
        }
    }
    cacheErrors.add(hasError);

    check(res, {
        'status 200': (r) => r.status === 200,
        'no errors': (r) => {
            try {
                const b = JSON.parse(r.body);
                return !b.errors || b.errors.length === 0;
            } catch (e) {
                return false;
            }
        },
    });

    return { duration, size: res.body ? res.body.length : 0 };
}

// ── Phase Functions ────────────────────────────────────────

export function coldCachePhase() {
    group('Cold Cache: First-time queries', function () {
        // Query each user — populates cache
        for (const userId of USER_IDS) {
            executeGraphQL(
                USER_DEEP_QUERY,
                { id: userId },
                coldCacheDuration,
                'COLD: UserDeep'
            );
        }
        // Dashboard query — populates list caches
        executeGraphQL(DASHBOARD_QUERY, {}, coldCacheDuration, 'COLD: Dashboard');
        executeGraphQL(PRODUCTS_QUERY, {}, coldCacheDuration, 'COLD: Products');
    });
    sleep(1);
}

export function warmCachePhase() {
    const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];

    group('Warm Cache: Cached queries', function () {
        executeGraphQL(
            USER_DEEP_QUERY,
            { id: userId },
            warmCacheDuration,
            'WARM: UserDeep'
        );
    });
    sleep(0.3);
}

export function mixedPhase() {
    group('Mixed: Varied query patterns', function () {
        const roll = Math.random();
        if (roll < 0.4) {
            // 40% — deep user query (likely cached)
            const userId = USER_IDS[Math.floor(Math.random() * USER_IDS.length)];
            executeGraphQL(
                USER_DEEP_QUERY,
                { id: userId },
                mixedCacheDuration,
                'MIXED: UserDeep'
            );
        } else if (roll < 0.7) {
            // 30% — dashboard query (likely cached)
            executeGraphQL(DASHBOARD_QUERY, {}, mixedCacheDuration, 'MIXED: Dashboard');
        } else {
            // 30% — products query
            executeGraphQL(PRODUCTS_QUERY, {}, mixedCacheDuration, 'MIXED: Products');
        }
    });
    sleep(0.3);
}

export function handleSummary(data) {
    const extractMetric = (name) => data.metrics[name] ? data.metrics[name].values : null;

    const summary = {
        type: 'Cache Impact Analysis',
        timestamp: new Date().toISOString(),
        cold_cache: {
            duration_ms: extractMetric('cold_cache_duration_ms'),
        },
        warm_cache: {
            duration_ms: extractMetric('warm_cache_duration_ms'),
        },
        mixed: {
            duration_ms: extractMetric('mixed_cache_duration_ms'),
        },
        overall: {
            total_requests: extractMetric('cache_total_requests'),
            error_rate: extractMetric('cache_test_errors'),
            http_req_duration: extractMetric('http_req_duration'),
        },
    };

    return {
        'benchmarks/results/cache-impact-summary.json': JSON.stringify(summary, null, 2),
        stdout: k6Summary(data, { indent: ' ', enableColors: true }),
    };
}

import { textSummary as k6Summary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
