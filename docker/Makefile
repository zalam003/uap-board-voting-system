# UAP Board Voting System - Docker Management
# Makefile for easy Docker operations

.PHONY: help build up down dev prod logs clean reset status

# Default target
help:
	@echo "UAP Board Voting System - Docker Commands"
	@echo "========================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-build    - Build and start development environment"
	@echo "  make dev-logs     - View development logs"
	@echo ""
	@echo "Production Commands:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production environment"
	@echo "  make prod-logs    - View production logs"
	@echo ""
	@echo "General Commands:"
	@echo "  make build        - Build all images"
	@echo "  make up           - Start services (default: production)"
	@echo "  make down         - Stop all services"
	@echo "  make logs         - View all logs"
	@echo "  make status       - Show running containers"
	@echo "  make clean        - Remove containers and images"
	@echo "  make reset        - Reset everything (clean + rebuild)"
	@echo "  make shell        - Access app container shell"
	@echo "  make db-shell     - Access database shell"
	@echo ""
	@echo "Admin Commands:"
	@echo "  make pgadmin      - Start pgAdmin for database management"
	@echo "  make backup-db    - Backup database"
	@echo "  make restore-db   - Restore database from backup"

# Development environment
dev:
	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

dev-build:
	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build

dev-logs:
	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f

dev-down:
	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down

# Production environment
prod:
	cd docker && docker-compose up -d

prod-build:
	cd docker && docker-compose up -d --build

prod-logs:
	cd docker && docker-compose logs -f

prod-down:
	cd docker && docker-compose down

# General commands
build:
	cd docker && docker-compose build

up:
	cd docker && docker-compose up -d

down:
	cd docker && docker-compose down

logs:
	cd docker && docker-compose logs -f

status:
	docker ps --filter "name=uap-voting"

# Shell access
shell:
	docker exec -it uap-voting-app /bin/sh

db-shell:
	docker exec -it uap-voting-postgres psql -U uap_voting -d uap_voting

# Admin tools
pgadmin:
	cd docker && docker-compose --profile admin up pgadmin -d
	@echo "pgAdmin available at: http://localhost:5050"
	@echo "Email: admin@uap-bd.edu"
	@echo "Password: admin"

# Database operations
backup-db:
	@echo "Creating database backup..."
	docker exec uap-voting-postgres pg_dump -U uap_voting -d uap_voting > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup completed!"

restore-db:
	@read -p "Enter backup file path: " backup_file; \
	docker exec -i uap-voting-postgres psql -U uap_voting -d uap_voting < $$backup_file

# Cleanup operations
clean:
	docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down --volumes --remove-orphans
	docker images -q uap-board-voting-system* | xargs -r docker rmi -f
	docker volume prune -f

reset: clean build up

# Health checks
health:
	@echo "Checking application health..."
	@curl -f http://localhost:3000/api/health || echo "Application not responding"
	@echo ""
	@echo "Checking database health..."
	@docker exec uap-voting-postgres pg_isready -U uap_voting -d uap_voting

# Quick setup
setup: dev
	@echo "Development environment is starting up..."
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Application should be available at: http://localhost:3000"
	@echo "pgAdmin available at: http://localhost:5050"
	@echo ""
	@echo "Use 'make logs' to view application logs"
	@echo "Use 'make down' to stop the environment"
