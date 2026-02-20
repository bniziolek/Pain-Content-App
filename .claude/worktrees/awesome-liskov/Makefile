# =============================================================================
# Makefile - Standard Commands for Portable Development
# =============================================================================
# Run `make help` to see all available commands
# =============================================================================

.PHONY: help setup dev test build start clean migrate docker-build docker-run lint check

# Default target
.DEFAULT_GOAL := help

# -----------------------------------------------------------------------------
# Help
# -----------------------------------------------------------------------------
help: ## Show this help message
        @echo "Available commands:"
        @echo ""
        @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
        @echo ""

# -----------------------------------------------------------------------------
# Core Commands (required by portability contract)
# -----------------------------------------------------------------------------
setup: ## Install all dependencies
        npm ci

dev: ## Start development server
        npm run dev

test: ## Run all tests (API tests via Vitest)
        npx vitest run --passWithNoTests

build: ## Build production artifacts
        npm run build

start: ## Run in production mode
        npm run start

# -----------------------------------------------------------------------------
# Database Commands
# -----------------------------------------------------------------------------
migrate: ## Run database migrations
        npm run db:push

migrate-generate: ## Generate new migration from schema changes
        npx drizzle-kit generate

# -----------------------------------------------------------------------------
# Code Quality
# -----------------------------------------------------------------------------
lint: ## Run linter
        npm run lint 2>/dev/null || echo "No lint script configured"

check: ## Run TypeScript type checking
        npm run check

# -----------------------------------------------------------------------------
# Docker Commands
# -----------------------------------------------------------------------------
docker-build: ## Build Docker image
        docker build -t app:latest .

docker-run: ## Run app in Docker container
        docker run --rm -p 5000:5000 --env-file .env app:latest

docker-up: ## Start local dev services (Postgres, etc.)
        docker-compose up -d postgres

docker-down: ## Stop local dev services
        docker-compose down

docker-logs: ## View Docker container logs
        docker-compose logs -f

# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------
clean: ## Clean build artifacts and dependencies
        rm -rf dist node_modules .cache

env-check: ## Validate required environment variables
        @echo "Checking required environment variables..."
        @test -n "$$DATABASE_URL" || (echo "ERROR: DATABASE_URL is not set" && exit 1)
        @echo "All required environment variables are set."
