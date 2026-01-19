#!/bin/bash
# Production Deployment Script for Lira Protocol
# This script deploys the application to production environment

set -e  # Exit on error

echo "🚀 Starting Lira Protocol Production Deployment"

# Configuration
ENVIRONMENT="production"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/smsdao}"
VERSION="${VERSION:-$(git describe --tags --always)}"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Production deployment confirmation
log_warn "⚠️  PRODUCTION DEPLOYMENT - This will affect live users!"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo ""
read -p "Are you sure you want to deploy to production? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    log_error "Deployment cancelled"
    exit 1
fi

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    log_error "Missing .env.production file"
    exit 1
fi

# Load production environment
log_info "Loading production environment variables..."
export $(cat .env.production | grep -v '^#' | xargs)

# Security checks
log_info "Running security checks..."

# Check for secrets in code
if grep -r "sk-" --include="*.ts" --include="*.tsx" --include="*.js" src/ 2>/dev/null; then
    log_error "Potential API keys found in source code"
    exit 1
fi

# Run dependency audit
log_info "Running npm audit..."
npm audit --production || log_warn "npm audit found issues"

# Run tests
log_info "Running comprehensive test suite..."
npm test || { log_error "Tests failed"; exit 1; }
npm run contracts:test || { log_error "Contract tests failed"; exit 1; }

# Build and tag Docker images
log_info "Building production Docker images..."

docker build -f Dockerfile.frontend -t ${DOCKER_REGISTRY}/lira-frontend:${VERSION} \
    -t ${DOCKER_REGISTRY}/lira-frontend:latest .

docker build -f Dockerfile.backend-php -t ${DOCKER_REGISTRY}/lira-backend-php:${VERSION} \
    -t ${DOCKER_REGISTRY}/lira-backend-php:latest .

docker build -f Dockerfile.backend-go -t ${DOCKER_REGISTRY}/lira-backend-go:${VERSION} \
    -t ${DOCKER_REGISTRY}/lira-backend-go:latest .

docker build -f Dockerfile.backend-java -t ${DOCKER_REGISTRY}/lira-backend-java:${VERSION} \
    -t ${DOCKER_REGISTRY}/lira-backend-java:latest .

# Push images to registry
log_info "Pushing images to registry..."
docker push ${DOCKER_REGISTRY}/lira-frontend:${VERSION}
docker push ${DOCKER_REGISTRY}/lira-frontend:latest
docker push ${DOCKER_REGISTRY}/lira-backend-php:${VERSION}
docker push ${DOCKER_REGISTRY}/lira-backend-php:latest
docker push ${DOCKER_REGISTRY}/lira-backend-go:${VERSION}
docker push ${DOCKER_REGISTRY}/lira-backend-go:latest
docker push ${DOCKER_REGISTRY}/lira-backend-java:${VERSION}
docker push ${DOCKER_REGISTRY}/lira-backend-java:latest

# Deploy to production
log_info "Deploying to production..."
docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d

# Health checks
log_info "Performing health checks..."
sleep 15

check_health() {
    local service=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        log_info "$service is healthy ✓"
        return 0
    else
        log_error "$service health check failed ✗"
        return 1
    fi
}

check_health "Frontend" "${PRODUCTION_FRONTEND_URL:-https://lira.app}"
check_health "PHP API" "${PRODUCTION_PHP_API_URL:-https://api.lira.app}/health"
check_health "Go API" "${PRODUCTION_GO_API_URL:-https://go-api.lira.app}/health"
check_health "Java API" "${PRODUCTION_JAVA_API_URL:-https://java-api.lira.app}/actuator/health"

# Create deployment record
log_info "Creating deployment record..."
echo "{
  \"version\": \"${VERSION}\",
  \"environment\": \"production\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"deployer\": \"$(whoami)\",
  \"commit\": \"$(git rev-parse HEAD)\"
}" > deployments/production-${VERSION}.json

log_info "✅ Production deployment completed successfully!"
echo ""
echo "Deployment Version: $VERSION"
echo "Frontend URL: ${PRODUCTION_FRONTEND_URL:-https://lira.app}"
echo ""
echo "Monitor logs: docker-compose logs -f"
echo "Rollback: ./scripts/rollback-production.sh"
