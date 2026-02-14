#!/usr/bin/env bash
# ============================================================
#  QURACUS Benchmark Runner
#  Runs REST waterfall and GraphQL aggregated load tests
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN} QURACUS Performance Benchmark Suite${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Check k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}k6 is not installed. Install it:${NC}"
    echo "  Windows: winget install grafana.k6"
    echo "  macOS:   brew install k6"
    echo "  Linux:   snap install k6"
    exit 1
fi

# Check services are reachable
echo -e "${YELLOW}Checking services...${NC}"
for svc in "localhost:8080/graphql" "localhost:8081/users" "localhost:8082/products" "localhost:8083/orders"; do
    if curl -sf "http://$svc" > /dev/null 2>&1 || curl -sf -X POST "http://$svc" -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}' > /dev/null 2>&1; then
        echo -e "  ${GREEN}OK${NC} $svc"
    else
        echo -e "  ${YELLOW}WARN${NC} $svc (may not be running)"
    fi
done
echo ""

mkdir -p "$RESULTS_DIR"

# ── Run mode ────────────────────────────────────────────────
MODE="${1:-all}"

case "$MODE" in
    rest)
        echo -e "${GREEN}Running REST Waterfall benchmark...${NC}"
        k6 run "$SCRIPT_DIR/rest-waterfall.js" \
            --out json="$RESULTS_DIR/rest-${TIMESTAMP}.json"
        ;;
    graphql)
        echo -e "${GREEN}Running GraphQL Aggregated benchmark...${NC}"
        k6 run "$SCRIPT_DIR/graphql-aggregated.js" \
            --out json="$RESULTS_DIR/graphql-${TIMESTAMP}.json"
        ;;
    comparison)
        echo -e "${GREEN}Running side-by-side comparison...${NC}"
        k6 run "$SCRIPT_DIR/comparison.js" \
            --out json="$RESULTS_DIR/comparison-${TIMESTAMP}.json"
        ;;
    quick)
        echo -e "${GREEN}Running quick test (10 VUs, 10s each)...${NC}"
        echo -e "${CYAN}--- REST Waterfall ---${NC}"
        k6 run --vus 10 --duration 10s "$SCRIPT_DIR/rest-waterfall.js"
        echo ""
        echo -e "${CYAN}--- GraphQL Aggregated ---${NC}"
        k6 run --vus 10 --duration 10s "$SCRIPT_DIR/graphql-aggregated.js"
        ;;
    all)
        echo -e "${GREEN}Running full benchmark suite...${NC}"
        echo ""

        echo -e "${CYAN}[1/3] REST Waterfall${NC}"
        k6 run "$SCRIPT_DIR/rest-waterfall.js" \
            --out json="$RESULTS_DIR/rest-${TIMESTAMP}.json"
        echo ""

        echo -e "${CYAN}[2/3] GraphQL Aggregated${NC}"
        k6 run "$SCRIPT_DIR/graphql-aggregated.js" \
            --out json="$RESULTS_DIR/graphql-${TIMESTAMP}.json"
        echo ""

        echo -e "${CYAN}[3/3] Side-by-Side Comparison${NC}"
        k6 run "$SCRIPT_DIR/comparison.js" \
            --out json="$RESULTS_DIR/comparison-${TIMESTAMP}.json"
        ;;
    *)
        echo "Usage: $0 [rest|graphql|comparison|quick|all]"
        echo ""
        echo "  rest        - Run REST waterfall benchmark only"
        echo "  graphql     - Run GraphQL aggregated benchmark only"
        echo "  comparison  - Run side-by-side comparison"
        echo "  quick       - Quick 10s smoke test for both"
        echo "  all         - Run full suite (default)"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done! Results saved to: $RESULTS_DIR/${NC}"
echo -e "JSON summaries: $RESULTS_DIR/*-summary.json"
