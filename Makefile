# =============================================================================
# FAMILY INVESTMENT DASHBOARD - Makefile
# =============================================================================

.PHONY: help build up down logs api worker web db clean

# Default target
help:
	@echo "Family Investment Dashboard - Available commands:"
	@echo ""
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make up-d       - Start all services in detached mode"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View logs from all services"
	@echo "  make logs-api   - View API logs"
	@echo "  make logs-worker - View Worker logs"
	@echo "  make api        - Start only API service"
	@echo "  make worker     - Start only Worker service"
	@echo "  make web        - Start only Web service"
	@echo "  make db         - Start only database services"
	@echo "  make shell-api  - Open shell in API container"
	@echo "  make shell-db   - Open psql shell"
	@echo "  make clean      - Remove all containers and volumes"
	@echo "  make reset      - Reset everything (WARNING: destroys data)"
	@echo ""

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up

# Start in detached mode
up-d:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-worker:
	docker-compose logs -f worker

logs-web:
	docker-compose logs -f web

# Individual services
api:
	docker-compose up -d postgres redis minio
	@echo "Waiting for infrastructure..."
	@sleep 5
	docker-compose up api

worker:
	docker-compose up worker

web:
	docker-compose up -d api
	docker-compose up web

db:
	docker-compose up -d postgres redis minio

# Shell access
shell-api:
	docker-compose exec api bash

shell-db:
	docker-compose exec postgres psql -U investor -d investments

# Cleanup
clean:
	docker-compose down -v

destroy: clean
	docker system prune -f

reset: clean
	@echo "WARNING: This will destroy all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker volume rm investments_postgres_data investments_minio_data investments_redis_data 2>/dev/null || true; \
		echo "All data destroyed."; \
	fi

# Development helpers
dev-web:
	cd web && npm run dev

dev-api:
	cd api && uvicorn main:app --reload --host 0.0.0.0

dev-worker:
	cd worker && python main.py
