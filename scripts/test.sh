#!/bin/bash

# DriverPath Test Runner Script
# Usage: ./scripts/test.sh [option]
# Options:
#   e2e     - Run Playwright E2E tests
#   api     - Run Vitest API tests
#   smoke   - Run all smoke tests (E2E + API)
#   help    - Show this help message

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

run_e2e_tests() {
    print_header "Running Playwright E2E Tests"
    print_info "Starting E2E test suite..."
    npx playwright test --reporter=list
    print_success "E2E tests completed"
}

run_api_tests() {
    print_header "Running Vitest API Tests"
    print_info "Starting API test suite..."
    npx vitest run --reporter=verbose
    print_success "API tests completed"
}

run_all_tests() {
    print_header "Running Full Smoke Test Suite"
    
    print_info "Step 1/2: Running API tests..."
    npx vitest run --reporter=verbose
    print_success "API tests passed"
    
    echo ""
    
    print_info "Step 2/2: Running E2E tests..."
    npx playwright test --reporter=list
    print_success "E2E tests passed"
    
    print_header "All Smoke Tests Passed!"
}

show_help() {
    echo -e "${BLUE}DriverPath Test Runner${NC}"
    echo ""
    echo "Usage: ./scripts/test.sh [option]"
    echo ""
    echo "Options:"
    echo "  e2e     Run Playwright E2E browser tests"
    echo "  api     Run Vitest API integration tests"
    echo "  smoke   Run all smoke tests (API + E2E)"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/test.sh smoke   # Run full smoke test suite"
    echo "  ./scripts/test.sh api     # Quick API validation"
    echo "  ./scripts/test.sh e2e     # Full browser testing"
}

# Main menu
case "${1:-menu}" in
    e2e)
        run_e2e_tests
        ;;
    api)
        run_api_tests
        ;;
    smoke|all)
        run_all_tests
        ;;
    help|--help|-h)
        show_help
        ;;
    menu|*)
        echo -e "${BLUE}DriverPath Test Runner${NC}"
        echo ""
        echo "Select test suite to run:"
        echo ""
        echo "  1) E2E Tests (Playwright browser tests)"
        echo "  2) API Tests (Vitest integration tests)"
        echo "  3) Smoke Tests (All tests)"
        echo "  4) Help"
        echo "  5) Exit"
        echo ""
        read -p "Enter choice [1-5]: " choice
        
        case $choice in
            1) run_e2e_tests ;;
            2) run_api_tests ;;
            3) run_all_tests ;;
            4) show_help ;;
            5) echo "Exiting..."; exit 0 ;;
            *) echo "Invalid choice"; exit 1 ;;
        esac
        ;;
esac
