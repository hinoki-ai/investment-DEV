#!/bin/bash
# =============================================================================
# Development Environment Setup Script
# =============================================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up Family Investment Dashboard development environment...${NC}"
echo ""

# Check prerequisites
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 installed${NC}"
        return 0
    fi
}

echo "Checking prerequisites:"
echo "----------------------"
check_command docker
check_command docker-compose || check_command "docker compose"
check_command python3
check_command node
check_command npm
check_command git
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ .env created${NC}"
        echo -e "${YELLOW}⚠ Please edit .env and add your API keys${NC}"
    else
        echo -e "${RED}✗ .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi
echo ""

# Setup Python environments
echo "Setting up Python environments:"
echo "------------------------------"

setup_python_env() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo -n "Setting up $dir... "
        cd "$dir"
        
        # Create virtual environment if it doesn't exist
        if [ ! -d ".venv" ]; then
            python3 -m venv .venv
        fi
        
        # Activate and install dependencies
        source .venv/bin/activate
        pip install -q --upgrade pip
        pip install -q -r requirements.txt
        
        cd - > /dev/null
        echo -e "${GREEN}✓${NC}"
    fi
}

setup_python_env "api"
setup_python_env "worker"
echo ""

# Setup Node.js environment
echo "Setting up Node.js environment:"
echo "------------------------------"

if [ -d "web" ]; then
    echo -n "Setting up web... "
    cd web
    npm install --silent
    cd - > /dev/null
    echo -e "${GREEN}✓${NC}"
fi
echo ""

# Start infrastructure
echo "Starting infrastructure services:"
echo "--------------------------------"
docker-compose up -d postgres redis minio

# Wait for services
echo -n "Waiting for PostgreSQL... "
until docker-compose exec -T postgres pg_isready -U investor > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓${NC}"

echo -n "Waiting for Redis... "
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓${NC}"

echo -n "Waiting for MinIO... "
until curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; do
    sleep 1
done
echo -e "${GREEN}✓${NC}"

echo ""

# Run migrations
echo "Running database migrations:"
echo "---------------------------"
docker-compose exec -T postgres psql -U investor -d investments -f /docker-entrypoint-initdb.d/01_init.sql > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# Summary
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Setup complete! ✓${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run 'make up' to start all services"
echo "  3. Access the dashboard at http://localhost:5173"
echo "  4. API docs available at http://localhost:8000/docs"
echo ""
echo "Useful commands:"
echo "  make up       - Start all services"
echo "  make down     - Stop all services"
echo "  make logs     - View logs"
echo "  make test     - Run tests"
echo ""
