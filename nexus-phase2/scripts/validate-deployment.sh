#!/bin/bash
# Nexus Phase 2 - Pre-Deployment Validation Script
# Run this before deploying to production
# Usage: ./scripts/validate-deployment.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

echo -e "${BLUE}"
echo "========================================"
echo "  Nexus Phase 2 - Deployment Validator"
echo "========================================"
echo -e "${NC}"

# ============================================
# Helper Functions
# ============================================

pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    echo -e "   ${RED}$2${NC}"
    ((CHECKS_FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ============================================
# File Structure Validation
# ============================================

echo ""
echo -e "${BLUE}Checking File Structure...${NC}"

required_files=(
    "package.json"
    "wrangler.toml"
    "tsconfig.json"
    "schema.sql"
    "src/index.ts"
    "src/types/index.ts"
    "src/lib/db.ts"
    "src/lib/utils.ts"
    "src/routes/projects.ts"
    "src/routes/services.ts"
    "src/routes/usage.ts"
    "src/routes/sync.ts"
    "src/routes/notifications.ts"
    "migrations/001_initial.sql"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        pass "Required file exists: $file"
    else
        fail "Missing required file: $file"
    fi
done

# ============================================
# Package.json Validation
# ============================================

echo ""
echo -e "${BLUE}Validating package.json...${NC}"

if [ -f "package.json" ]; then
    # Check for required fields
    if grep -q '"name"' package.json; then
        pass "package.json has name field"
    else
        fail "package.json missing name field"
    fi
    
    if grep -q '"version"' package.json; then
        pass "package.json has version field"
    else
        fail "package.json missing version field"
    fi
    
    # Check for required scripts
    required_scripts=("dev" "deploy")
    for script in "${required_scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            pass "Script '$script' defined"
        else
            fail "Missing script: $script"
        fi
    done
    
    # Check for required dependencies
    if grep -q '@cloudflare/workers-types' package.json; then
        pass "Cloudflare workers types installed"
    else
        warn "Cloudflare workers types may be missing"
    fi
    
    if grep -q 'wrangler' package.json; then
        pass "Wrangler CLI installed"
    else
        fail "Wrangler CLI not found in dependencies"
    fi
    
    if grep -q 'typescript' package.json; then
        pass "TypeScript installed"
    else
        fail "TypeScript not found in dependencies"
    fi
fi

# ============================================
# Wrangler.toml Validation
# ============================================

echo ""
echo -e "${BLUE}Validating wrangler.toml...${NC}"

if [ -f "wrangler.toml" ]; then
    # Check required fields
    if grep -q '^name\s*=' wrangler.toml; then
        pass "wrangler.toml has name"
    else
        fail "wrangler.toml missing name"
    fi
    
    if grep -q '^main\s*=' wrangler.toml; then
        pass "wrangler.toml has main entry point"
    else
        fail "wrangler.toml missing main entry point"
    fi
    
    if grep -q 'compatibility_date' wrangler.toml; then
        pass "wrangler.toml has compatibility_date"
    else
        warn "wrangler.toml missing compatibility_date"
    fi
    
    # Check for D1 database binding
    if grep -q '\[\[d1_databases\]\]' wrangler.toml; then
        pass "D1 database binding configured"
    else
        fail "D1 database binding not found"
    fi
    
    if grep -q 'binding\s*=\s*"DB"' wrangler.toml; then
        pass "D1 binding name is 'DB'"
    else
        fail "D1 binding name should be 'DB'"
    fi
    
    # Check for placeholder database_id
    if grep -q '<your-database-id-here>' wrangler.toml || grep -q 'database_id.*=.*""' wrangler.toml; then
        fail "database_id is not set" "Update wrangler.toml with your actual D1 database ID"
    elif grep -q 'database_id' wrangler.toml; then
        pass "database_id is configured"
    else
        fail "database_id not found in wrangler.toml"
    fi
    
    # Check environment variables
    if grep -q '\[vars\]' wrangler.toml; then
        pass "Environment variables section exists"
    else
        warn "No [vars] section in wrangler.toml"
    fi
else
    fail "wrangler.toml not found"
fi

# ============================================
# TypeScript Validation
# ============================================

echo ""
echo -e "${BLUE}Validating TypeScript Configuration...${NC}"

if [ -f "tsconfig.json" ]; then
    if grep -q '"strict":\s*true' tsconfig.json; then
        pass "TypeScript strict mode enabled"
    else
        warn "TypeScript strict mode not enabled"
    fi
    
    if grep -q '@cloudflare/workers-types' tsconfig.json; then
        pass "Cloudflare workers types in tsconfig"
    else
        warn "Cloudflare workers types not in tsconfig"
    fi
else
    fail "tsconfig.json not found"
fi

# ============================================
# Source Code Validation
# ============================================

echo ""
echo -e "${BLUE}Validating Source Code...${NC}"

# Check for common issues in TypeScript files
if [ -d "src" ]; then
    # Check for console.log statements (warnings in production)
    console_logs=$(grep -r "console\.log" src/ --include="*.ts" 2>/dev/null | wc -l)
    if [ "$console_logs" -gt 0 ]; then
        warn "Found $console_logs console.log statements (consider removing for production)"
    else
        pass "No console.log statements found"
    fi
    
    # Check for TODO comments
    todos=$(grep -r "TODO\|FIXME\|XXX" src/ --include="*.ts" 2>/dev/null | wc -l)
    if [ "$todos" -gt 0 ]; then
        warn "Found $todos TODO/FIXME comments"
        grep -r "TODO\|FIXME\|XXX" src/ --include="*.ts" 2>/dev/null | head -5 | while read line; do
            echo -e "   ${YELLOW}$line${NC}"
        done
    else
        pass "No TODO/FIXME comments found"
    fi
    
    # Check for proper error handling
    if grep -rq "try {" src/ --include="*.ts"; then
        pass "Error handling (try/catch) found in source"
    else
        warn "No try/catch blocks found - verify error handling"
    fi
    
    # Check for proper TypeScript types
    type_definitions=$(grep -r "interface\|type " src/types/ --include="*.ts" 2>/dev/null | wc -l)
    if [ "$type_definitions" -gt 10 ]; then
        pass "Type definitions found ($type_definitions)"
    else
        warn "Limited type definitions found ($type_definitions)"
    fi
fi

# ============================================
# Database Schema Validation
# ============================================

echo ""
echo -e "${BLUE}Validating Database Schema...${NC}"

if [ -f "schema.sql" ]; then
    # Check for required tables
    required_tables=("projects" "services" "usage_limits" "sync_state" "notifications")
    for table in "${required_tables[@]}"; do
        if grep -qi "CREATE TABLE.*$table" schema.sql; then
            pass "Table '$table' defined in schema"
        else
            fail "Table '$table' not found in schema"
        fi
    done
    
    # Check for indexes
    index_count=$(grep -c "CREATE INDEX" schema.sql 2>/dev/null || echo "0")
    if [ "$index_count" -ge 5 ]; then
        pass "Indexes defined ($index_count found)"
    else
        warn "Limited indexes found ($index_count)"
    fi
    
    # Check for triggers
    if grep -q "CREATE TRIGGER" schema.sql; then
        pass "Triggers defined for auto-updating timestamps"
    else
        warn "No triggers found for timestamp updates"
    fi
else
    fail "schema.sql not found"
fi

if [ -f "migrations/001_initial.sql" ]; then
    pass "Migration file exists"
else
    fail "Migration file not found"
fi

# ============================================
# Dependencies Check
# ============================================

echo ""
echo -e "${BLUE}Checking Dependencies...${NC}"

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        pass "node_modules exists"
    else
        fail "node_modules not found" "Run: npm install"
    fi
    
    # Check for wrangler
    if command -v npx &> /dev/null; then
        if npx wrangler --version &> /dev/null; then
            wrangler_version=$(npx wrangler --version 2>&1 | head -1)
            pass "Wrangler CLI available ($wrangler_version)"
        else
            fail "Wrangler CLI not available" "Run: npm install wrangler"
        fi
    else
        warn "npx not available, skipping wrangler check"
    fi
fi

# ============================================
# Environment Variables Check
# ============================================

echo ""
echo -e "${BLUE}Checking Environment Variables...${NC}"

# Check for .dev.vars (local development)
if [ -f ".dev.vars" ]; then
    pass ".dev.vars file exists for local development"
else
    info ".dev.vars not found (optional for local development)"
fi

# Check for .gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".dev.vars" .gitignore; then
        pass ".dev.vars is in .gitignore"
    else
        warn ".dev.vars should be in .gitignore"
    fi
    
    if grep -q "node_modules" .gitignore; then
        pass "node_modules is in .gitignore"
    else
        warn "node_modules should be in .gitignore"
    fi
else
    warn ".gitignore not found"
fi

# ============================================
# Documentation Check
# ============================================

echo ""
echo -e "${BLUE}Checking Documentation...${NC}"

if [ -f "README.md" ]; then
    pass "README.md exists"
    
    # Check for key sections
    if grep -qi "install" README.md; then
        pass "README has installation instructions"
    else
        warn "README missing installation instructions"
    fi
    
    if grep -qi "deploy" README.md; then
        pass "README has deployment instructions"
    else
        warn "README missing deployment instructions"
    fi
else
    warn "README.md not found"
fi

if [ -f "TESTING.md" ]; then
    pass "TESTING.md exists"
else
    warn "TESTING.md not found"
fi

# ============================================
# Test Suite Check
# ============================================

echo ""
echo -e "${BLUE}Checking Test Suite...${NC}"

if [ -d "tests" ]; then
    pass "tests directory exists"
    
    test_files=$(find tests -name "*.test.js" -o -name "*.test.ts" -o -name "*.spec.js" -o -name "*.spec.ts" 2>/dev/null | wc -l)
    if [ "$test_files" -gt 0 ]; then
        pass "Test files found ($test_files)"
    else
        warn "No test files found in tests/"
    fi
    
    if [ -f "tests/curl-tests.sh" ]; then
        pass "curl test script exists"
    else
        warn "curl test script not found"
    fi
else
    warn "tests directory not found"
fi

# ============================================
# Build Validation (if possible)
# ============================================

echo ""
echo -e "${BLUE}Running Build Validation...${NC}"

if command -v npx &> /dev/null && [ -f "package.json" ]; then
    # Try TypeScript check
    if grep -q '"typecheck"' package.json; then
        info "Running TypeScript type check..."
        if npx tsc --noEmit 2>&1 | tee /tmp/tsc_output.txt; then
            pass "TypeScript type check passed"
        else
            fail "TypeScript type check failed" "Run: npx tsc --noEmit"
            cat /tmp/tsc_output.txt
        fi
    else
        info "No typecheck script in package.json"
    fi
else
    warn "Skipping build validation (npx not available)"
fi

# ============================================
# Summary
# ============================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "  ${GREEN}✓ Passed: $CHECKS_PASSED${NC}"
echo -e "  ${RED}✗ Failed: $CHECKS_FAILED${NC}"
echo -e "  ${YELLOW}⚠ Warnings: $WARNINGS${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo -e "${GREEN}✓ Project is ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run tests: ./tests/curl-tests.sh"
    echo "  2. Deploy: npm run deploy"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}✗ Deployment validation failed!${NC}"
    echo -e "${RED}✗ Please fix the failed checks before deploying.${NC}"
    echo ""
    exit 1
fi
