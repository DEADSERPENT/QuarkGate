#!/usr/bin/env node
/**
 * Benchmark Report Generator
 *
 * Reads JSON summaries from benchmarks/results/ and generates a thesis-quality
 * HTML report with Chart.js visualizations comparing REST vs GraphQL performance.
 *
 * Usage:
 *   node benchmarks/generate-report.js
 *
 * Output:
 *   benchmarks/results/benchmark-report.html
 */

const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');
const OUTPUT_FILE = path.join(RESULTS_DIR, 'benchmark-report.html');

// ── Load result files ───────────────────────────────────────
function loadJSON(filename) {
    const filepath = path.join(RESULTS_DIR, filename);
    if (!fs.existsSync(filepath)) return null;
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

const restData = loadJSON('rest-waterfall-summary.json');
const graphqlData = loadJSON('graphql-aggregated-summary.json');
const comparisonData = loadJSON('comparison-summary.json');
const cacheData = loadJSON('cache-impact-summary.json');

if (!restData && !graphqlData) {
    console.error('No benchmark results found in benchmarks/results/');
    console.error('Run the benchmarks first: run-benchmarks.bat all');
    process.exit(1);
}

// ── Helper functions ────────────────────────────────────────
function fmt(val, decimals = 2) {
    if (val == null || isNaN(val)) return 'N/A';
    return Number(val).toFixed(decimals);
}

function pctChange(baseline, improved) {
    if (!baseline || !improved || baseline === 0) return 'N/A';
    const change = ((baseline - improved) / baseline) * 100;
    return `${change > 0 ? '-' : '+'}${Math.abs(change).toFixed(1)}%`;
}

function getMetricValue(data, key, stat = 'avg') {
    if (!data) return null;
    const metrics = data.metrics || data;
    if (metrics[key] && metrics[key][stat] !== undefined) return metrics[key][stat];
    if (metrics[key] && metrics[key].values && metrics[key].values[stat] !== undefined) return metrics[key].values[stat];
    return null;
}

// ── Extract key metrics ─────────────────────────────────────
const restLatency = restData ? restData.metrics.rest_waterfall_total_ms : null;
const gqlLatency = graphqlData ? graphqlData.metrics.graphql_query_total_ms : null;
const restPayload = restData ? restData.metrics.rest_total_payload_bytes : null;
const gqlPayload = graphqlData ? graphqlData.metrics.graphql_payload_bytes : null;
const restCalls = restData ? restData.metrics.rest_total_http_calls : null;
const gqlCalls = graphqlData ? graphqlData.metrics.graphql_total_requests : null;
const restHttpReqs = restData ? restData.metrics.http_reqs : null;
const gqlHttpReqs = graphqlData ? graphqlData.metrics.http_reqs : null;

// Comparison data
const compRest = comparisonData ? comparisonData.rest : null;
const compGql = comparisonData ? comparisonData.graphql : null;

// Cache data
const coldCache = cacheData ? cacheData.cold_cache : null;
const warmCache = cacheData ? cacheData.warm_cache : null;

// ── Generate HTML ───────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuarkGate Performance Benchmark Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            background: #f8fafc; color: #1e293b;
            line-height: 1.6; padding: 2rem;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: 2rem; margin-bottom: 0.25rem; color: #0f172a; }
        h2 { font-size: 1.5rem; margin: 2.5rem 0 1rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
        h3 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; color: #334155; }
        .subtitle { color: #64748b; margin-bottom: 2rem; font-size: 1.1rem; }
        .timestamp { color: #94a3b8; font-size: 0.85rem; margin-bottom: 2rem; }

        /* Summary cards */
        .summary-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.25rem; margin-bottom: 2rem;
        }
        .card {
            background: white; border-radius: 12px; padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
        }
        .card-label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .card-value { font-size: 2rem; font-weight: 700; margin: 0.25rem 0; }
        .card-detail { font-size: 0.85rem; color: #94a3b8; }
        .card-value.rest { color: #ef4444; }
        .card-value.graphql { color: #3b82f6; }
        .card-value.improvement { color: #10b981; }

        /* Charts */
        .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .chart-container {
            background: white; border-radius: 12px; padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;
        }
        .chart-container.full-width { grid-column: 1 / -1; }
        .chart-title { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #334155; }
        canvas { max-height: 400px; }

        /* Tables */
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; font-size: 0.85rem; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
        td { font-size: 0.95rem; }
        tr:hover { background: #f8fafc; }
        .val-rest { color: #ef4444; font-weight: 600; }
        .val-gql { color: #3b82f6; font-weight: 600; }
        .val-good { color: #10b981; font-weight: 600; }

        /* Key findings */
        .finding {
            background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem 1.25rem;
            border-radius: 0 8px 8px 0; margin: 1rem 0;
        }
        .finding.positive { background: #f0fdf4; border-color: #10b981; }
        .finding.neutral { background: #fefce8; border-color: #eab308; }

        .legend { display: flex; gap: 1.5rem; margin: 1rem 0; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; }

        @media (max-width: 768px) {
            .chart-grid { grid-template-columns: 1fr; }
            .summary-grid { grid-template-columns: 1fr 1fr; }
            body { padding: 1rem; }
        }

        @media print {
            body { background: white; }
            .card, .chart-container { box-shadow: none; border: 1px solid #ccc; }
            .chart-container { break-inside: avoid; }
        }
    </style>
</head>
<body>
<div class="container">
    <h1>QuarkGate Performance Benchmark Report</h1>
    <p class="subtitle">GraphQL Gateway Aggregation vs REST Waterfall Pattern</p>
    <p class="timestamp">Generated: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
    ${restData ? `| REST test: ${restData.timestamp}` : ''}
    ${graphqlData ? `| GraphQL test: ${graphqlData.timestamp}` : ''}</p>

    <!-- ── Executive Summary ─────────────────────────────── -->
    <h2>1. Executive Summary</h2>
    <div class="summary-grid">
        <div class="card">
            <div class="card-label">REST Avg Latency</div>
            <div class="card-value rest">${restLatency ? fmt(restLatency.avg) : 'N/A'} ms</div>
            <div class="card-detail">p95: ${restLatency ? fmt(restLatency['p(95)']) : 'N/A'} ms | max: ${restLatency ? fmt(restLatency.max) : 'N/A'} ms</div>
        </div>
        <div class="card">
            <div class="card-label">GraphQL Avg Latency</div>
            <div class="card-value graphql">${gqlLatency ? fmt(gqlLatency.avg) : 'N/A'} ms</div>
            <div class="card-detail">p95: ${gqlLatency ? fmt(gqlLatency['p(95)']) : 'N/A'} ms | max: ${gqlLatency ? fmt(gqlLatency.max) : 'N/A'} ms</div>
        </div>
        <div class="card">
            <div class="card-label">REST HTTP Calls / Iteration</div>
            <div class="card-value rest">${restCalls ? fmt(restCalls.count / (restHttpReqs ? restHttpReqs.count / restCalls.count : 1), 0) : 'N/A'}</div>
            <div class="card-detail">Total calls: ${restCalls ? restCalls.count : 'N/A'} | Rate: ${restCalls ? fmt(restCalls.rate) : 'N/A'}/s</div>
        </div>
        <div class="card">
            <div class="card-label">GraphQL HTTP Calls / Iteration</div>
            <div class="card-value graphql">1</div>
            <div class="card-detail">Total requests: ${gqlCalls ? gqlCalls.count : 'N/A'} | Rate: ${gqlCalls ? fmt(gqlCalls.rate) : 'N/A'}/s</div>
        </div>
        ${restLatency && gqlLatency ? `
        <div class="card">
            <div class="card-label">Avg Latency Improvement</div>
            <div class="card-value improvement">${pctChange(restLatency.avg, gqlLatency.avg)}</div>
            <div class="card-detail">GraphQL gateway aggregation vs REST waterfall</div>
        </div>
        ` : ''}
        ${restPayload && gqlPayload ? `
        <div class="card">
            <div class="card-label">Avg Payload Size</div>
            <div class="card-value improvement">${pctChange(restPayload.avg, gqlPayload.avg)}</div>
            <div class="card-detail">REST: ${fmt(restPayload.avg, 0)}B vs GraphQL: ${fmt(gqlPayload.avg, 0)}B</div>
        </div>
        ` : ''}
    </div>

    <!-- ── Key Findings ──────────────────────────────────── -->
    <h3>Key Findings</h3>
    ${restLatency && gqlLatency ? `
    <div class="finding ${gqlLatency.avg < restLatency.avg ? 'positive' : 'neutral'}">
        <strong>Latency:</strong> GraphQL gateway averages <strong>${fmt(gqlLatency.avg)}ms</strong> vs REST waterfall at <strong>${fmt(restLatency.avg)}ms</strong>.
        ${gqlLatency.avg > restLatency.avg
            ? 'The gateway adds overhead per request but reduces total client round-trips from ~5-9 to 1, which benefits high-latency networks.'
            : `GraphQL is <strong>${pctChange(restLatency.avg, gqlLatency.avg)}</strong> faster due to parallel internal scatter-gather.`
        }
    </div>` : ''}
    <div class="finding positive">
        <strong>Network Efficiency:</strong> REST requires <strong>5-9 sequential HTTP round-trips</strong> per user while GraphQL requires exactly <strong>1 request</strong>.
        Under high-latency conditions (mobile, global distribution), this reduction is significant.
    </div>
    ${restPayload && gqlPayload ? `
    <div class="finding ${gqlPayload.avg < restPayload.avg ? 'positive' : 'neutral'}">
        <strong>Payload Size:</strong> REST transfers an average of <strong>${fmt(restPayload.avg, 0)} bytes</strong> vs GraphQL at <strong>${fmt(gqlPayload.avg, 0)} bytes</strong>.
        GraphQL's field-level selection eliminates over-fetching.
    </div>` : ''}

    <!-- ── Latency Comparison Chart ──────────────────────── -->
    <h2>2. Latency Analysis</h2>
    <div class="chart-grid">
        <div class="chart-container">
            <div class="chart-title">Average Latency Comparison (ms)</div>
            <canvas id="latencyAvgChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Latency Percentiles (ms)</div>
            <canvas id="latencyPercentilesChart"></canvas>
        </div>
    </div>

    <!-- ── Detailed metrics table ────────────────────────── -->
    <h3>Detailed Latency Metrics</h3>
    <div class="card">
    <table>
        <thead>
            <tr><th>Metric</th><th>Min</th><th>Avg</th><th>Median</th><th>p90</th><th>p95</th><th>Max</th></tr>
        </thead>
        <tbody>
            ${restLatency ? `
            <tr>
                <td><strong class="val-rest">REST Waterfall (total)</strong></td>
                <td>${fmt(restLatency.min)}</td><td>${fmt(restLatency.avg)}</td><td>${fmt(restLatency.med)}</td>
                <td>${fmt(restLatency['p(90)'])}</td><td>${fmt(restLatency['p(95)'])}</td><td>${fmt(restLatency.max)}</td>
            </tr>` : ''}
            ${gqlLatency ? `
            <tr>
                <td><strong class="val-gql">GraphQL Aggregated</strong></td>
                <td>${fmt(gqlLatency.min)}</td><td>${fmt(gqlLatency.avg)}</td><td>${fmt(gqlLatency.med)}</td>
                <td>${fmt(gqlLatency['p(90)'])}</td><td>${fmt(gqlLatency['p(95)'])}</td><td>${fmt(gqlLatency.max)}</td>
            </tr>` : ''}
            ${restData && restData.metrics.rest_user_call_ms ? `
            <tr>
                <td>&nbsp;&nbsp;REST: GET /users/:id</td>
                <td>${fmt(restData.metrics.rest_user_call_ms.min)}</td><td>${fmt(restData.metrics.rest_user_call_ms.avg)}</td>
                <td>${fmt(restData.metrics.rest_user_call_ms.med)}</td><td>${fmt(restData.metrics.rest_user_call_ms['p(90)'])}</td>
                <td>${fmt(restData.metrics.rest_user_call_ms['p(95)'])}</td><td>${fmt(restData.metrics.rest_user_call_ms.max)}</td>
            </tr>` : ''}
            ${restData && restData.metrics.rest_orders_call_ms ? `
            <tr>
                <td>&nbsp;&nbsp;REST: GET /orders/user/:id</td>
                <td>${fmt(restData.metrics.rest_orders_call_ms.min)}</td><td>${fmt(restData.metrics.rest_orders_call_ms.avg)}</td>
                <td>${fmt(restData.metrics.rest_orders_call_ms.med)}</td><td>${fmt(restData.metrics.rest_orders_call_ms['p(90)'])}</td>
                <td>${fmt(restData.metrics.rest_orders_call_ms['p(95)'])}</td><td>${fmt(restData.metrics.rest_orders_call_ms.max)}</td>
            </tr>` : ''}
            ${restData && restData.metrics.rest_products_scatter_ms ? `
            <tr>
                <td>&nbsp;&nbsp;REST: GET /products/:id (scatter)</td>
                <td>${fmt(restData.metrics.rest_products_scatter_ms.min)}</td><td>${fmt(restData.metrics.rest_products_scatter_ms.avg)}</td>
                <td>${fmt(restData.metrics.rest_products_scatter_ms.med)}</td><td>${fmt(restData.metrics.rest_products_scatter_ms['p(90)'])}</td>
                <td>${fmt(restData.metrics.rest_products_scatter_ms['p(95)'])}</td><td>${fmt(restData.metrics.rest_products_scatter_ms.max)}</td>
            </tr>` : ''}
            ${restData && restData.metrics.rest_payment_call_ms ? `
            <tr>
                <td>&nbsp;&nbsp;REST: GET /payments/order/:id</td>
                <td>${fmt(restData.metrics.rest_payment_call_ms.min)}</td><td>${fmt(restData.metrics.rest_payment_call_ms.avg)}</td>
                <td>${fmt(restData.metrics.rest_payment_call_ms.med)}</td><td>${fmt(restData.metrics.rest_payment_call_ms['p(90)'])}</td>
                <td>${fmt(restData.metrics.rest_payment_call_ms['p(95)'])}</td><td>${fmt(restData.metrics.rest_payment_call_ms.max)}</td>
            </tr>` : ''}
        </tbody>
    </table>
    </div>

    <!-- ── Payload & Network ─────────────────────────────── -->
    <h2>3. Network Efficiency</h2>
    <div class="chart-grid">
        <div class="chart-container">
            <div class="chart-title">HTTP Round Trips per User Query</div>
            <canvas id="httpCallsChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Payload Size (bytes)</div>
            <canvas id="payloadChart"></canvas>
        </div>
    </div>

    <!-- ── Throughput ────────────────────────────────────── -->
    <h2>4. Throughput Analysis</h2>
    <div class="chart-grid">
        <div class="chart-container">
            <div class="chart-title">Requests per Second</div>
            <canvas id="throughputChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Total Requests Completed</div>
            <canvas id="totalRequestsChart"></canvas>
        </div>
    </div>

    <!-- ── Cache Impact ──────────────────────────────────── -->
    ${cacheData ? `
    <h2>5. Redis Cache Impact</h2>
    <div class="chart-grid">
        <div class="chart-container">
            <div class="chart-title">Cold Cache vs Warm Cache Latency (ms)</div>
            <canvas id="cacheChart"></canvas>
        </div>
        <div class="chart-container">
            <div class="chart-title">Cache Performance Summary</div>
            <canvas id="cacheBarChart"></canvas>
        </div>
    </div>
    <div class="card">
    <table>
        <thead><tr><th>Phase</th><th>Min</th><th>Avg</th><th>Median</th><th>p90</th><th>p95</th><th>Max</th></tr></thead>
        <tbody>
            ${coldCache && coldCache.duration_ms ? `
            <tr>
                <td><strong class="val-rest">Cold Cache</strong></td>
                <td>${fmt(coldCache.duration_ms.min)}</td><td>${fmt(coldCache.duration_ms.avg)}</td>
                <td>${fmt(coldCache.duration_ms.med)}</td><td>${fmt(coldCache.duration_ms['p(90)'])}</td>
                <td>${fmt(coldCache.duration_ms['p(95)'])}</td><td>${fmt(coldCache.duration_ms.max)}</td>
            </tr>` : ''}
            ${warmCache && warmCache.duration_ms ? `
            <tr>
                <td><strong class="val-gql">Warm Cache</strong></td>
                <td>${fmt(warmCache.duration_ms.min)}</td><td>${fmt(warmCache.duration_ms.avg)}</td>
                <td>${fmt(warmCache.duration_ms.med)}</td><td>${fmt(warmCache.duration_ms['p(90)'])}</td>
                <td>${fmt(warmCache.duration_ms['p(95)'])}</td><td>${fmt(warmCache.duration_ms.max)}</td>
            </tr>` : ''}
        </tbody>
    </table>
    </div>
    ${coldCache && coldCache.duration_ms && warmCache && warmCache.duration_ms ? `
    <div class="finding positive">
        <strong>Cache Improvement:</strong> Redis caching reduced average response time from
        <strong>${fmt(coldCache.duration_ms.avg)}ms</strong> (cold) to <strong>${fmt(warmCache.duration_ms.avg)}ms</strong> (warm),
        a <strong>${pctChange(coldCache.duration_ms.avg, warmCache.duration_ms.avg)}</strong> improvement.
    </div>` : ''}
    ` : `
    <h2>5. Redis Cache Impact</h2>
    <div class="finding neutral">
        <strong>No cache benchmark data available.</strong> Run: <code>run-benchmarks.bat cache</code> to generate cache impact data.
    </div>
    `}

    <!-- ── Comparison (side-by-side) ─────────────────────── -->
    ${comparisonData ? `
    <h2>6. Side-by-Side Comparison (Simultaneous Load)</h2>
    <div class="chart-grid">
        <div class="chart-container full-width">
            <div class="chart-title">REST vs GraphQL Under Identical Load Conditions</div>
            <canvas id="comparisonChart"></canvas>
        </div>
    </div>
    <div class="card">
    <table>
        <thead><tr><th>Metric</th><th class="val-rest">REST</th><th class="val-gql">GraphQL</th><th>Improvement</th></tr></thead>
        <tbody>
            ${compRest && compRest.total_duration_ms && compGql && compGql.total_duration_ms ? `
            <tr>
                <td>Avg Latency</td>
                <td class="val-rest">${fmt(compRest.total_duration_ms.avg)} ms</td>
                <td class="val-gql">${fmt(compGql.total_duration_ms.avg)} ms</td>
                <td class="val-good">${pctChange(compRest.total_duration_ms.avg, compGql.total_duration_ms.avg)}</td>
            </tr>
            <tr>
                <td>p95 Latency</td>
                <td class="val-rest">${fmt(compRest.total_duration_ms['p(95)'])} ms</td>
                <td class="val-gql">${fmt(compGql.total_duration_ms['p(95)'])} ms</td>
                <td class="val-good">${pctChange(compRest.total_duration_ms['p(95)'], compGql.total_duration_ms['p(95)'])}</td>
            </tr>` : ''}
            ${compRest && compRest.payload_bytes && compGql && compGql.payload_bytes ? `
            <tr>
                <td>Avg Payload Size</td>
                <td class="val-rest">${fmt(compRest.payload_bytes.avg, 0)} B</td>
                <td class="val-gql">${fmt(compGql.payload_bytes.avg, 0)} B</td>
                <td class="val-good">${pctChange(compRest.payload_bytes.avg, compGql.payload_bytes.avg)}</td>
            </tr>` : ''}
            ${compRest && compRest.http_call_count && compGql && compGql.http_call_count ? `
            <tr>
                <td>Total HTTP Calls</td>
                <td class="val-rest">${compRest.http_call_count.count}</td>
                <td class="val-gql">${compGql.http_call_count.count}</td>
                <td class="val-good">${pctChange(compRest.http_call_count.count, compGql.http_call_count.count)}</td>
            </tr>` : ''}
            ${compRest && compRest.error_rate && compGql && compGql.error_rate ? `
            <tr>
                <td>Error Rate</td>
                <td class="val-rest">${fmt((compRest.error_rate.rate || 0) * 100)}%</td>
                <td class="val-gql">${fmt((compGql.error_rate.rate || 0) * 100)}%</td>
                <td>-</td>
            </tr>` : ''}
        </tbody>
    </table>
    </div>
    ` : ''}

    <!-- ── Methodology ───────────────────────────────────── -->
    <h2>${comparisonData ? '7' : '6'}. Test Methodology</h2>
    <div class="card" style="padding: 2rem;">
        <h3 style="margin-top: 0;">Test Environment</h3>
        <table>
            <tr><td><strong>Architecture</strong></td><td>QuarkGate — Quarkus 3.17.2 microservices with GraphQL gateway</td></tr>
            <tr><td><strong>Services</strong></td><td>User, Product, Order, Payment (each with dedicated PostgreSQL)</td></tr>
            <tr><td><strong>Gateway</strong></td><td>SmallRye GraphQL + Redis cache (60s/120s TTL) + Fault Tolerance</td></tr>
            <tr><td><strong>Infrastructure</strong></td><td>Docker Compose: 4 PostgreSQL, Redis 7, Kafka (Confluent 7.5), Keycloak 23, Jaeger 1.62</td></tr>
            <tr><td><strong>Load Tool</strong></td><td>Grafana k6</td></tr>
        </table>

        <h3>Load Scenarios</h3>
        <table>
            <thead><tr><th>Scenario</th><th>Virtual Users</th><th>Duration</th><th>Purpose</th></tr></thead>
            <tbody>
                <tr><td>Baseline</td><td>10 VUs</td><td>30s</td><td>Establish baseline latency</td></tr>
                <tr><td>Moderate</td><td>50 VUs</td><td>30s</td><td>Typical production load</td></tr>
                <tr><td>Stress</td><td>100 VUs</td><td>30s</td><td>High load behavior</td></tr>
                <tr><td>Spike</td><td>0 &rarr; 200 &rarr; 0</td><td>40s</td><td>Burst traffic resilience</td></tr>
            </tbody>
        </table>

        <h3>REST Waterfall Pattern (Control)</h3>
        <p>Simulates the traditional N+1 problem: sequential HTTP calls from client to each microservice.</p>
        <pre style="background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0;">
GET /users/1                    → User-Service     (1 call)
GET /orders/user/1              → Order-Service    (1 call)
GET /products/1                 → Product-Service  (N calls)
GET /products/2                 → Product-Service
GET /payments/order/1           → Payment-Service  (N calls)
GET /payments/order/2           → Payment-Service
                                  Total: 5-9+ HTTP round trips</pre>

        <h3>GraphQL Gateway Pattern (Treatment)</h3>
        <p>Single GraphQL query; gateway performs scatter-gather internally with parallel resolution.</p>
        <pre style="background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0;">
POST /graphql {
  user(id: 1) {
    orders { products, payment }
  }
}
→ Gateway internally fans out to all 4 services in parallel
← Single JSON response
                                  Total: 1 HTTP round trip</pre>
    </div>

    <!-- ── Footer ────────────────────────────────────────── -->
    <div style="text-align: center; margin: 3rem 0 1rem; color: #94a3b8; font-size: 0.85rem;">
        QuarkGate Benchmark Report | M.Tech Thesis — GraphQL Gateway Aggregation Pattern for Microservices
    </div>
</div>

<script>
    const COLORS = {
        rest: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
        graphql: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
        improvement: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
        cold: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316' },
        warm: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
        mixed: { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7' },
    };

    const defaultOptions = {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
    };

    // ── Chart 1: Average Latency ─────────────────────────
    ${restLatency && gqlLatency ? `
    new Chart(document.getElementById('latencyAvgChart'), {
        type: 'bar',
        data: {
            labels: ['Average', 'Median', 'Min', 'Max'],
            datasets: [
                {
                    label: 'REST Waterfall',
                    data: [${restLatency.avg}, ${restLatency.med}, ${restLatency.min}, ${restLatency.max}],
                    backgroundColor: COLORS.rest.bg, borderColor: COLORS.rest.border, borderWidth: 2,
                },
                {
                    label: 'GraphQL Aggregated',
                    data: [${gqlLatency.avg}, ${gqlLatency.med}, ${gqlLatency.min}, ${gqlLatency.max}],
                    backgroundColor: COLORS.graphql.bg, borderColor: COLORS.graphql.border, borderWidth: 2,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'Milliseconds' } } } },
    });` : '// No latency data available'}

    // ── Chart 2: Latency Percentiles ─────────────────────
    ${restLatency && gqlLatency ? `
    new Chart(document.getElementById('latencyPercentilesChart'), {
        type: 'line',
        data: {
            labels: ['Min', 'p50 (Median)', 'p90', 'p95', 'Max'],
            datasets: [
                {
                    label: 'REST Waterfall',
                    data: [${restLatency.min}, ${restLatency.med}, ${restLatency['p(90)']}, ${restLatency['p(95)']}, ${restLatency.max}],
                    borderColor: COLORS.rest.border, backgroundColor: COLORS.rest.bg, fill: true, tension: 0.3,
                },
                {
                    label: 'GraphQL Aggregated',
                    data: [${gqlLatency.min}, ${gqlLatency.med}, ${gqlLatency['p(90)']}, ${gqlLatency['p(95)']}, ${gqlLatency.max}],
                    borderColor: COLORS.graphql.border, backgroundColor: COLORS.graphql.bg, fill: true, tension: 0.3,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'Milliseconds' } } } },
    });` : '// No percentile data available'}

    // ── Chart 3: HTTP Calls ──────────────────────────────
    new Chart(document.getElementById('httpCallsChart'), {
        type: 'doughnut',
        data: {
            labels: ['REST (5-9 calls)', 'GraphQL (1 call)'],
            datasets: [{
                data: [7, 1],
                backgroundColor: [COLORS.rest.bg, COLORS.graphql.bg],
                borderColor: [COLORS.rest.border, COLORS.graphql.border],
                borderWidth: 2,
            }],
        },
        options: defaultOptions,
    });

    // ── Chart 4: Payload Size ────────────────────────────
    ${restPayload && gqlPayload ? `
    new Chart(document.getElementById('payloadChart'), {
        type: 'bar',
        data: {
            labels: ['Average', 'Min', 'Max'],
            datasets: [
                {
                    label: 'REST Waterfall',
                    data: [${restPayload.avg}, ${restPayload.min}, ${restPayload.max}],
                    backgroundColor: COLORS.rest.bg, borderColor: COLORS.rest.border, borderWidth: 2,
                },
                {
                    label: 'GraphQL Aggregated',
                    data: [${gqlPayload.avg}, ${gqlPayload.min}, ${gqlPayload.max}],
                    backgroundColor: COLORS.graphql.bg, borderColor: COLORS.graphql.border, borderWidth: 2,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'Bytes' } } } },
    });` : '// No payload data available'}

    // ── Chart 5: Throughput ──────────────────────────────
    ${restHttpReqs && gqlHttpReqs ? `
    new Chart(document.getElementById('throughputChart'), {
        type: 'bar',
        data: {
            labels: ['Requests per Second'],
            datasets: [
                {
                    label: 'REST Waterfall',
                    data: [${restHttpReqs.rate}],
                    backgroundColor: COLORS.rest.bg, borderColor: COLORS.rest.border, borderWidth: 2,
                },
                {
                    label: 'GraphQL Aggregated',
                    data: [${gqlHttpReqs.rate}],
                    backgroundColor: COLORS.graphql.bg, borderColor: COLORS.graphql.border, borderWidth: 2,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'req/s' } } } },
    });
    new Chart(document.getElementById('totalRequestsChart'), {
        type: 'bar',
        data: {
            labels: ['Total Requests Completed'],
            datasets: [
                {
                    label: 'REST Waterfall',
                    data: [${restHttpReqs.count}],
                    backgroundColor: COLORS.rest.bg, borderColor: COLORS.rest.border, borderWidth: 2,
                },
                {
                    label: 'GraphQL Aggregated',
                    data: [${gqlHttpReqs.count}],
                    backgroundColor: COLORS.graphql.bg, borderColor: COLORS.graphql.border, borderWidth: 2,
                },
            ],
        },
        options: defaultOptions,
    });` : '// No throughput data available'}

    // ── Chart 6: Cache Impact ────────────────────────────
    ${cacheData && coldCache && coldCache.duration_ms && warmCache && warmCache.duration_ms ? `
    new Chart(document.getElementById('cacheChart'), {
        type: 'line',
        data: {
            labels: ['Min', 'p50', 'p90', 'p95', 'Max'],
            datasets: [
                {
                    label: 'Cold Cache',
                    data: [${coldCache.duration_ms.min}, ${coldCache.duration_ms.med}, ${coldCache.duration_ms['p(90)']}, ${coldCache.duration_ms['p(95)']}, ${coldCache.duration_ms.max}],
                    borderColor: COLORS.cold.border, backgroundColor: COLORS.cold.bg, fill: true, tension: 0.3,
                },
                {
                    label: 'Warm Cache',
                    data: [${warmCache.duration_ms.min}, ${warmCache.duration_ms.med}, ${warmCache.duration_ms['p(90)']}, ${warmCache.duration_ms['p(95)']}, ${warmCache.duration_ms.max}],
                    borderColor: COLORS.warm.border, backgroundColor: COLORS.warm.bg, fill: true, tension: 0.3,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'Milliseconds' } } } },
    });
    new Chart(document.getElementById('cacheBarChart'), {
        type: 'bar',
        data: {
            labels: ['Average', 'Median', 'p95'],
            datasets: [
                {
                    label: 'Cold Cache',
                    data: [${coldCache.duration_ms.avg}, ${coldCache.duration_ms.med}, ${coldCache.duration_ms['p(95)']}],
                    backgroundColor: COLORS.cold.bg, borderColor: COLORS.cold.border, borderWidth: 2,
                },
                {
                    label: 'Warm Cache',
                    data: [${warmCache.duration_ms.avg}, ${warmCache.duration_ms.med}, ${warmCache.duration_ms['p(95)']}],
                    backgroundColor: COLORS.warm.bg, borderColor: COLORS.warm.border, borderWidth: 2,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'Milliseconds' } } } },
    });` : '// No cache data available'}

    // ── Chart 7: Comparison ──────────────────────────────
    ${comparisonData && compRest && compRest.total_duration_ms && compGql && compGql.total_duration_ms ? `
    new Chart(document.getElementById('comparisonChart'), {
        type: 'bar',
        data: {
            labels: ['Average Latency (ms)', 'Median Latency (ms)', 'p95 Latency (ms)', 'Max Latency (ms)'],
            datasets: [
                {
                    label: 'REST Waterfall',
                    data: [
                        ${compRest.total_duration_ms.avg}, ${compRest.total_duration_ms.med},
                        ${compRest.total_duration_ms['p(95)']}, ${compRest.total_duration_ms.max}
                    ],
                    backgroundColor: COLORS.rest.bg, borderColor: COLORS.rest.border, borderWidth: 2,
                },
                {
                    label: 'GraphQL Aggregated',
                    data: [
                        ${compGql.total_duration_ms.avg}, ${compGql.total_duration_ms.med},
                        ${compGql.total_duration_ms['p(95)']}, ${compGql.total_duration_ms.max}
                    ],
                    backgroundColor: COLORS.graphql.bg, borderColor: COLORS.graphql.border, borderWidth: 2,
                },
            ],
        },
        options: { ...defaultOptions, scales: { y: { title: { display: true, text: 'Milliseconds' } } } },
    });` : '// No comparison data available'}
</script>
</body>
</html>`;

// ── Write output ────────────────────────────────────────────
fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');
console.log(`Report generated: ${OUTPUT_FILE}`);
console.log(`Open in browser to view charts and analysis.`);
