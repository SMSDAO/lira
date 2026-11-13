#!/bin/bash
# Security Scan Script for Lira Protocol
# Runs comprehensive security checks on the codebase

set -e

echo "🔒 Starting Security Scan for Lira Protocol"

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

FAILED=0

# 1. Check for secrets in code
log_info "Checking for hardcoded secrets..."
if grep -r -E "(sk-|pk_|secret_key|private_key|api_key).*=.*['\"](?![A-Z_]+)" \
    --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
    --exclude-dir=node_modules --exclude-dir=.next src/ 2>/dev/null; then
    log_error "⚠️  Potential hardcoded secrets found in source code!"
    FAILED=1
else
    log_info "✓ No hardcoded secrets detected"
fi

# 2. Check .env.example has placeholders
log_info "Validating .env.example..."
if grep -E "=(sk-|pk_|[a-f0-9]{32})" .env.example 2>/dev/null; then
    log_error "⚠️  .env.example contains actual values instead of placeholders!"
    FAILED=1
else
    log_info "✓ .env.example validated"
fi

# 3. NPM Audit
log_info "Running npm audit..."
if npm audit --audit-level=moderate; then
    log_info "✓ npm audit passed"
else
    log_warn "⚠️  npm audit found vulnerabilities"
    FAILED=1
fi

# 4. Dependency check
log_info "Checking for outdated dependencies..."
npm outdated || log_warn "Some dependencies are outdated"

# 5. Slither (Solidity static analysis)
log_info "Running Slither on smart contracts..."
if command -v slither &> /dev/null; then
    if slither . --config-file .slither.config.json 2>/dev/null; then
        log_info "✓ Slither analysis passed"
    else
        log_warn "⚠️  Slither found potential issues"
        # Don't fail on Slither warnings for now
    fi
else
    log_warn "Slither not installed, skipping (install: pip install slither-analyzer)"
fi

# 6. Check for console.log in production code
log_info "Checking for console.log statements..."
if grep -r "console\.log" src/pages src/components --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test"; then
    log_warn "⚠️  console.log statements found in production code"
fi

# 7. TypeScript strict mode check
log_info "Validating TypeScript configuration..."
if grep -q '"strict": true' tsconfig.json; then
    log_info "✓ TypeScript strict mode enabled"
else
    log_warn "⚠️  TypeScript strict mode not enabled"
fi

# 8. Check CI secrets exposure
log_info "Checking CI configuration for secret exposure..."
if grep -r "echo.*\$" .github/workflows/ --include="*.yml" 2>/dev/null | grep -v "github.sha"; then
    log_error "⚠️  Potential secret exposure in CI logs!"
    FAILED=1
else
    log_info "✓ CI configuration secure"
fi

# 9. Docker security check
log_info "Checking Dockerfile security best practices..."
DOCKER_ISSUES=0

for dockerfile in Dockerfile*; do
    if [ -f "$dockerfile" ]; then
        # Check for running as root
        if ! grep -q "USER" "$dockerfile"; then
            log_warn "⚠️  $dockerfile doesn't specify non-root USER"
            DOCKER_ISSUES=$((DOCKER_ISSUES + 1))
        fi
        
        # Check for specific versions
        if grep -E "FROM.*:latest" "$dockerfile" > /dev/null; then
            log_warn "⚠️  $dockerfile uses :latest tag"
            DOCKER_ISSUES=$((DOCKER_ISSUES + 1))
        fi
    fi
done

if [ $DOCKER_ISSUES -eq 0 ]; then
    log_info "✓ Dockerfile security checks passed"
fi

# 10. Git hooks check
log_info "Checking git hooks..."
if [ ! -f ".git/hooks/pre-commit" ]; then
    log_warn "⚠️  No pre-commit hook installed"
fi

# Summary
echo ""
echo "================================================"
echo "Security Scan Summary"
echo "================================================"

if [ $FAILED -eq 0 ]; then
    log_info "✅ All critical security checks passed!"
    exit 0
else
    log_error "❌ Security scan failed! Please address the issues above."
    exit 1
fi
