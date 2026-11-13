#!/bin/bash
# Staging Deployment Script for Lira Protocol
# This script deploys the application to staging environment

set -e  # Exit on error

echo "🚀 Starting Lira Protocol Staging Deployment"

# Configuration
ENVIRONMENT="staging"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/smsdao}"
VERSION="${VERSION:-latest}"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Load environment variables
if [ -f ".env.staging" ]; then
    log_info "Loading staging environment variables..."
    export $(cat .env.staging | grep -v '^#' | xargs)
else
    log_warn "No .env.staging file found, using defaults"
fi

# Build Docker images
log_info "Building Docker images..."

docker build -f Dockerfile.frontend -t ${DOCKER_REGISTRY}/lira-frontend:${VERSION} .
docker build -f Dockerfile.backend-php -t ${DOCKER_REGISTRY}/lira-backend-php:${VERSION} .
docker build -f Dockerfile.backend-go -t ${DOCKER_REGISTRY}/lira-backend-go:${VERSION} .
docker build -f Dockerfile.backend-java -t ${DOCKER_REGISTRY}/lira-backend-java:${VERSION} .

log_info "Docker images built successfully"

# Run tests before deployment
log_info "Running tests..."
npm test || { log_error "Frontend tests failed"; exit 1; }
npm run contracts:test || { log_error "Contract tests failed"; exit 1; }

log_info "All tests passed"

# Deploy with Docker Compose
log_info "Deploying to staging environment..."

docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Wait for services to be healthy
log_info "Waiting for services to be healthy..."
sleep 10

# Check health endpoints
log_info "Checking service health..."

check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_info "$service is healthy"
            return 0
        fi
        log_warn "$service not ready, attempt $attempt/$max_attempts"
        sleep 2
        ((attempt++))
    done

    log_error "$service failed health check"
    return 1
}

check_health "Frontend" "http://localhost:3000"
check_health "PHP API" "http://localhost:8000/health"
check_health "Go API" "http://localhost:8080/health"
check_health "Java API" "http://localhost:8081/actuator/health"

# Display deployment info
log_info "✅ Staging deployment completed successfully!"
echo ""
echo "Service URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  PHP API:   http://localhost:8000"
echo "  Go API:    http://localhost:8080"
echo "  Java API:  http://localhost:8081"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"
