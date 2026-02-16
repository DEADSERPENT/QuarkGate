#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# QuarkGate Kubernetes Deployment Script
# Deploy the full microservices stack to a K8s cluster
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN} QuarkGate — Kubernetes Deployment${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# Check prerequisites
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl not found. Please install it first.${NC}"
    exit 1
fi

MODE="${1:-all}"

case "$MODE" in
    namespace)
        echo -e "${GREEN}[1/4] Creating namespace...${NC}"
        kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
        ;;
    infra)
        echo -e "${GREEN}[2/4] Deploying infrastructure...${NC}"
        kubectl apply -f "$SCRIPT_DIR/infrastructure/"
        echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
        kubectl -n quarkgate wait --for=condition=available deployment/user-db --timeout=120s
        kubectl -n quarkgate wait --for=condition=available deployment/redis --timeout=60s
        kubectl -n quarkgate wait --for=condition=available deployment/kafka --timeout=120s
        echo -e "${GREEN}Infrastructure ready!${NC}"
        ;;
    services)
        echo -e "${GREEN}[3/4] Deploying microservices...${NC}"
        kubectl apply -f "$SCRIPT_DIR/base/services.yaml"
        echo -e "${YELLOW}Waiting for services to be ready...${NC}"
        kubectl -n quarkgate wait --for=condition=available deployment/user-service --timeout=180s
        kubectl -n quarkgate wait --for=condition=available deployment/graphql-gateway --timeout=180s
        echo -e "${GREEN}Services ready!${NC}"
        ;;
    scaling)
        echo -e "${GREEN}[4/4] Applying autoscaling & ingress...${NC}"
        kubectl apply -f "$SCRIPT_DIR/base/hpa.yaml"
        kubectl apply -f "$SCRIPT_DIR/base/ingress.yaml"
        ;;
    all)
        echo -e "${GREEN}[1/4] Creating namespace...${NC}"
        kubectl apply -f "$SCRIPT_DIR/namespace.yaml"
        echo ""

        echo -e "${GREEN}[2/4] Deploying infrastructure...${NC}"
        kubectl apply -f "$SCRIPT_DIR/infrastructure/"
        echo -e "${YELLOW}Waiting 30s for infrastructure startup...${NC}"
        sleep 30
        echo ""

        echo -e "${GREEN}[3/4] Deploying microservices...${NC}"
        kubectl apply -f "$SCRIPT_DIR/base/services.yaml"
        echo ""

        echo -e "${GREEN}[4/4] Applying autoscaling & ingress...${NC}"
        kubectl apply -f "$SCRIPT_DIR/base/hpa.yaml"
        kubectl apply -f "$SCRIPT_DIR/base/ingress.yaml"
        echo ""
        ;;
    status)
        echo -e "${CYAN}Namespace: quarkgate${NC}"
        kubectl -n quarkgate get pods -o wide
        echo ""
        echo -e "${CYAN}Services:${NC}"
        kubectl -n quarkgate get svc
        echo ""
        echo -e "${CYAN}HPA:${NC}"
        kubectl -n quarkgate get hpa
        echo ""
        echo -e "${CYAN}Ingress:${NC}"
        kubectl -n quarkgate get ingress
        ;;
    teardown)
        echo -e "${YELLOW}Deleting quarkgate namespace and all resources...${NC}"
        kubectl delete namespace quarkgate
        echo -e "${GREEN}Teardown complete.${NC}"
        ;;
    *)
        echo "Usage: $0 [namespace|infra|services|scaling|all|status|teardown]"
        echo ""
        echo "  namespace  - Create the quarkgate namespace"
        echo "  infra      - Deploy databases, Redis, Kafka, Jaeger, Keycloak"
        echo "  services   - Deploy the 5 microservices"
        echo "  scaling    - Apply HPA and Ingress rules"
        echo "  all        - Deploy everything (default)"
        echo "  status     - Show cluster status"
        echo "  teardown   - Delete everything"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
