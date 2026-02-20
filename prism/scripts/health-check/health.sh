#!/bin/bash
# =============================================================================
# Health Check Script for Family Investment Dashboard
# =============================================================================
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
WEB_URL="${WEB_URL:-http://localhost:5173}"
TIMEOUT=5

# Status tracking
ERRORS=0

# =============================================================================
# Helper Functions
# =============================================================================

check_http() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Checking $name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null); then
        if [ "$response" == "$expected_code" ]; then
            echo -e "${GREEN}✓ OK${NC} ($response)"
            return 0
        else
            echo -e "${RED}✗ FAILED${NC} (expected $expected_code, got $response)"
            ((ERRORS++))
            return 1
        fi
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        ((ERRORS++))
        return 1
    fi
}

check_tcp() {
    local name=$1
    local host=$2
    local port=$3
    
    echo -n "Checking $name ($host:$port)... "
    
    if timeout "$TIMEOUT" bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ UNREACHABLE${NC}"
        ((ERRORS++))
        return 1
    fi
}

check_docker() {
    local service=$1
    
    echo -n "Checking Docker service: $service... "
    
    if docker-compose ps "$service" | grep -q "Up"; then
        echo -e "${GREEN}✓ Running${NC}"
        return 0
    else
        echo -e "${RED}✗ Not Running${NC}"
        ((ERRORS++))
        return 1
    fi
}

# =============================================================================
# Main Checks
# =============================================================================

echo "=========================================="
echo "  Family Investment Dashboard Health Check"
echo "=========================================="
echo ""

# Docker services (if running via docker-compose)
if [ -f "docker-compose.yml" ]; then
    echo "Docker Services:"
    echo "----------------"
    check_docker "postgres" || true
    check_docker "redis" || true
    check_docker "minio" || true
    check_docker "api" || true
    check_docker "worker" || true
    echo ""
fi

# TCP Ports
echo "TCP Ports:"
echo "----------"
check_tcp "PostgreSQL" "localhost" "5432" || true
check_tcp "Redis" "localhost" "6379" || true
check_tcp "MinIO" "localhost" "9000" || true
check_tcp "MinIO Console" "localhost" "9001" || true
echo ""

# HTTP Endpoints
echo "HTTP Endpoints:"
echo "---------------"
check_http "API Health" "$API_URL/health" || true
check_http "API Root" "$API_URL/" || true
check_http "API Docs" "$API_URL/docs" || true
check_http "Web Dashboard" "$WEB_URL" || true
echo ""

# =============================================================================
# Summary
# =============================================================================

echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}$ERRORS check(s) failed${NC}"
    exit 1
fi
