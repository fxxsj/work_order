#!/bin/bash

# Quality gate script for 印刷施工单跟踪系统
# This script runs all quality checks and enforces quality gates

set -e

echo "🚀 Running Quality Gate Checks for 印刷施工单跟踪系统"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Quality thresholds
MIN_TEST_COVERAGE=80
MAX_SECURITY_ISSUES=0
MAX_CODE_SMELLS=10
MAX_DUPLICATION=5

# Track overall success
OVERALL_SUCCESS=true

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        OVERALL_SUCCESS=false
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "📋 Step 1: Backend Code Quality Checks"
echo "====================================="

# 1.1 Python code formatting check
echo "Checking Python code formatting with black..."
if cd backend && black --check .; then
    print_status 0 "Black formatting check"
else
    print_status 1 "Black formatting check"
fi

# 1.2 Import sorting check
echo "Checking import sorting with isort..."
if cd backend && isort --check-only .; then
    print_status 0 "Import sorting check"
else
    print_status 1 "Import sorting check"
fi

# 1.3 Linting with flake8
echo "Running flake8 linter..."
if cd backend && flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics; then
    print_status 0 "Flake8 critical errors"
else
    print_status 1 "Flake8 critical errors"
fi

if cd backend && flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics; then
    LINT_COUNT=$(cd backend && flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics | tail -1 | awk '{print $1}')
    if [ "$LINT_COUNT" -le $MAX_CODE_SMELLS ]; then
        print_status 0 "Flake8 code smells ($LINT_COUNT found)"
    else
        print_status 1 "Flake8 code smells ($LINT_COUNT found, max allowed: $MAX_CODE_SMELLS)"
    fi
fi

echo ""
echo "🔒 Step 2: Security Checks"
echo "==========================="

# 2.1 Security check with bandit
echo "Running security analysis with bandit..."
if cd backend && bandit -r . -f json -o bandit-report.json; then
    SECURITY_ISSUES=$(cat backend/bandit-report.json | jq '.results | map(select(.issue_severity == "HIGH" or .issue_severity == "MEDIUM")) | length')
    if [ "$SECURITY_ISSUES" -le $MAX_SECURITY_ISSUES ]; then
        print_status 0 "Security issues ($SECURITY_ISSUES found)"
    else
        print_status 1 "Security issues ($SECURITY_ISSUES found, max allowed: $MAX_SECURITY_ISSUES)"
    fi
else
    print_status 1 "Bandit security analysis"
fi

# 2.2 Dependency security check
echo "Checking dependency security with safety..."
if cd backend && safety check --json --output safety-report.json; then
    print_status 0 "Dependency security check"
else
    print_status 1 "Dependency security check"
fi

echo ""
echo "🧪 Step 3: Test Coverage"
echo "========================"

# 3.1 Run tests with coverage
echo "Running backend tests with coverage..."
if cd backend && python manage.py test --coverage --parallel=4; then
    # Extract coverage percentage (this would need to be adapted based on your coverage tool output)
    COVERAGE_PERCENTAGE=$(cd backend && coverage report | grep TOTAL | awk '{print $4}' | sed 's/%//')
    
    if (( $(echo "$COVERAGE_PERCENTAGE >= $MIN_TEST_COVERAGE" | bc -l) )); then
        print_status 0 "Test coverage ($COVERAGE_PERCENTAGE%)"
    else
        print_status 1 "Test coverage ($COVERAGE_PERCENTAGE%, minimum required: $MIN_TEST_COVERAGE%)"
    fi
else
    print_status 1 "Backend tests"
fi

echo ""
echo "🎨 Step 4: Frontend Quality Checks"
echo "================================="

# 4.1 Frontend linting
echo "Running frontend linting..."
if cd frontend && npm run lint; then
    print_status 0 "Frontend linting"
else
    print_status 1 "Frontend linting"
fi

# 4.2 Frontend tests
echo "Running frontend tests..."
if cd frontend && npm run test:unit; then
    print_status 0 "Frontend unit tests"
else
    print_status 1 "Frontend unit tests"
fi

echo ""
echo "🏗️  Step 5: Build Validation"
echo "============================"

# 5.1 Backend build check
echo "Checking backend build..."
if cd backend && python manage.py check; then
    print_status 0 "Django system check"
else
    print_status 1 "Django system check"
fi

# 5.2 Frontend build check
echo "Checking frontend build..."
if cd frontend && npm run build; then
    print_status 0 "Frontend production build"
else
    print_status 1 "Frontend production build"
fi

echo ""
echo "📦 Step 6: Package Quality"
echo "=========================="

# 6.1 Check for unused dependencies (optional)
echo "Checking for unused dependencies..."
if cd backend && pip-audit --requirement requirements.txt; then
    print_status 0 "Package audit"
else
    print_warning "Package audit (some issues may be acceptable)"
fi

echo ""
echo "📊 Step 7: Performance Checks"
echo "=============================="

# 7.1 Import performance check
echo "Checking import performance..."
if cd backend && python -c "
import time
import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

start_time = time.time()
from workorder.models import *
end_time = time.time()
import_time = end_time - start_time
print(f'Model import time: {import_time:.3f}s')
if import_time > 2.0:
    exit(1)
"; then
    print_status 0 "Import performance"
else
    print_status 1 "Import performance (too slow)"
fi

echo ""
echo "📈 Step 8: Quality Metrics Summary"
echo "=================================="

# Generate summary report
cat > quality-report.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "quality_gate": {
    "passed": $OVERALL_SUCCESS,
    "checks": {
      "backend_formatting": $(cd backend && black --check . > /dev/null 2>&1 && echo "true" || echo "false"),
      "backend_linting": $(cd backend && flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics > /dev/null 2>&1 && echo "true" || echo "false"),
      "security_issues": $SECURITY_ISSUES,
      "test_coverage": $COVERAGE_PERCENTAGE,
      "frontend_linting": $(cd frontend && npm run lint > /dev/null 2>&1 && echo "true" || echo "false"),
      "frontend_tests": $(cd frontend && npm run test:unit > /dev/null 2>&1 && echo "true" || echo "false")
    },
    "thresholds": {
      "min_test_coverage": $MIN_TEST_COVERAGE,
      "max_security_issues": $MAX_SECURITY_ISSUES,
      "max_code_smells": $MAX_CODE_SMELLS
    }
  }
}
EOF

echo "Quality report generated: quality-report.json"

echo ""
echo "🎯 Quality Gate Result"
echo "====================="

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}✅ QUALITY GATE PASSED${NC}"
    echo "All quality checks have passed successfully."
    echo "The code is ready for deployment."
    exit 0
else
    echo -e "${RED}❌ QUALITY GATE FAILED${NC}"
    echo "Some quality checks have failed."
    echo "Please review the failed checks and fix the issues before proceeding."
    echo ""
    echo "Detailed reports available:"
    echo "  - Security: backend/bandit-report.json"
    echo "  - Dependencies: backend/safety-report.json"
    echo "  - Quality: quality-report.json"
    exit 1
fi