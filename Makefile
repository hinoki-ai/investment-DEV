# =============================================================================
# NEXUS / Nest - Makefile
# =============================================================================

.PHONY: help build up down logs test lint format clean

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# Help
# =============================================================================

help: ## Show this help message
	@echo "NEXUS / Nest - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# Build
# =============================================================================

build: ## Build all Docker images
	docker-compose build

build-api: ## Build API Docker image
	docker-compose build api

build-worker: ## Build Worker Docker image
	docker-compose build worker

build-web: ## Build Web Docker image
	docker-compose build web

# =============================================================================
# Start/Stop
# =============================================================================

up: ## Start all services
	docker-compose up

up-d: ## Start all services in detached mode
	docker-compose up -d

up-prod: ## Start services in production mode
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

up-test: ## Start services for testing
	docker-compose -f docker-compose.yml -f docker-compose.test.yml up -d

down: ## Stop all services
	docker-compose down

down-v: ## Stop all services and remove volumes
	docker-compose down -v

restart: down up-d ## Restart all services

# =============================================================================
# Logs
# =============================================================================

logs: ## View logs from all services
	docker-compose logs -f

logs-api: ## View API logs
	docker-compose logs -f api

logs-worker: ## View Worker logs
	docker-compose logs -f worker

logs-web: ## View Web logs
	docker-compose logs -f web

logs-db: ## View database logs
	docker-compose logs -f postgres

# =============================================================================
# Individual Services
# =============================================================================

api: ## Start API service with infrastructure
	docker-compose up -d postgres redis minio
	@echo "Waiting for infrastructure..."
	@sleep 5
	docker-compose up api

worker: ## Start Worker service
	docker-compose up worker

web: ## Start Web service with API
	docker-compose up -d api
	docker-compose up web

db: ## Start database services only
	docker-compose up -d postgres redis minio

# =============================================================================
# Development
# =============================================================================

dev-setup: ## Run initial development setup
	./scripts/setup/init-dev.sh

dev-api: ## Run API locally (outside Docker)
	cd api && source .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0

dev-worker: ## Run Worker locally (outside Docker)
	cd worker && source .venv/bin/activate && python main.py

dev-web: ## Run Web locally (outside Docker)
	cd web && npm run dev

# =============================================================================
# Testing
# =============================================================================

test: test-api test-worker test-web ## Run all tests

test-api: ## Run API tests
	cd api && pytest -v

test-api-cov: ## Run API tests with coverage
	cd api && pytest --cov=. --cov-report=html -v

test-worker: ## Run Worker tests
	cd worker && pytest -v || true

test-web: ## Run Web tests
	cd web && npm run test || true

test-e2e: ## Run E2E tests (requires services to be running)
	@echo "E2E tests not yet implemented"

# =============================================================================
# Linting & Formatting
# =============================================================================

lint: lint-api lint-worker lint-web ## Run all linters

lint-api: ## Lint API code
	cd api && ruff check .
	cd api && mypy . --ignore-missing-imports

lint-worker: ## Lint Worker code
	cd worker && ruff check . || true

lint-web: ## Lint Web code
	cd web && npm run lint

format: format-api format-worker format-web ## Format all code

format-api: ## Format API code
	cd api && ruff format .
	cd api && ruff check --fix . || true

format-worker: ## Format Worker code
	cd worker && ruff format . || true

format-web: ## Format Web code
	cd web && npx prettier --write "src/**/*.{ts,tsx}" || true

# =============================================================================
# Database
# =============================================================================

migrate: ## Run database migrations
	docker-compose exec postgres psql -U investor -d investments -f /docker-entrypoint-initdb.d/01_init.sql

migrate-fresh: ## Reset database with fresh schema
	docker-compose exec postgres psql -U investor -d investments -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) migrate

db-backup: ## Create database backup
	./scripts/migration/backup.sh

db-restore: ## Restore database from backup (use: make db-restore BACKUP=backups/xxx.sql)
	./scripts/migration/restore.sh $(BACKUP)

db-seed: ## Seed database with sample data
	@echo "Seeding database..."
	docker-compose exec postgres psql -U investor -d investments -f /seeds/sample_data.sql || echo "No seed file found"

shell-db: ## Open database shell
	docker-compose exec postgres psql -U investor -d investments

# =============================================================================
# Shell Access
# =============================================================================

shell-api: ## Open shell in API container
	docker-compose exec api bash

shell-worker: ## Open shell in Worker container
	docker-compose exec worker bash

shell-web: ## Open shell in Web container
	docker-compose exec web sh

# =============================================================================
# Health & Monitoring
# =============================================================================

health: ## Run health checks
	./scripts/health-check/health.sh

status: ## Show service status
	docker-compose ps

stats: ## Show resource usage
	docker stats --no-stream

# =============================================================================
# Maintenance
# =============================================================================

clean: ## Remove containers and volumes
	docker-compose down -v
	@echo "Containers and volumes removed"

clean-images: ## Remove built images
	docker-compose down --rmi local
	@echo "Images removed"

prune: ## Prune Docker system
	docker system prune -f

reset: clean ## Reset everything (WARNING: destroys data!)
	@echo "WARNING: This will destroy all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker volume rm investments_postgres_data investments_minio_data investments_redis_data 2>/dev/null || true; \
		echo "All data destroyed."; \
	fi

# =============================================================================
# Deployment
# =============================================================================

deploy-web: ## Deploy web to Vercel
	cd web && npx vercel --prod

deploy-api-staging: ## Deploy API to staging (Railway/Render)
	@echo "Deploying API to staging..."
	@echo "Set up Railway/Render CLI and run: railway up"

deploy-api-prod: ## Deploy API to production
	@echo "Deploying API to production..."
	@echo "Requires manual approval"

# =============================================================================
# Utilities
# =============================================================================

secrets: ## Generate random secrets for .env
	@echo "JWT_SECRET=$$(openssl rand -hex 32)"
	@echo "ENCRYPTION_KEY=$$(openssl rand -hex 32)"

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

install-hooks: ## Install git hooks
	pre-commit install
	pre-commit install --hook-type commit-msg

docs: ## Generate documentation
	@echo "Generating documentation..."
	cd api && python -m pydoc-markdown || echo "Install pydoc-markdown for API docs"

changelog: ## Generate changelog
	git log --pretty=format:"- %s (%h)" --no-merges | head -50

# =============================================================================
# Mobile
# =============================================================================

mobile-build: ## Build Android app
	cd mobile/android && ./gradlew assembleDebug

mobile-install: ## Install Android app to connected device
	cd mobile/android && ./gradlew installDebug

mobile-clean: ## Clean Android build
	cd mobile/android && ./gradlew clean
