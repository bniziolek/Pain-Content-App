#!/bin/bash

# DriverPath Test Runner Script
# Usage: ./scripts/test.sh [option]
# Run without options for interactive menu

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_subheader() {
    echo -e "\n${CYAN}── $1 ──${NC}\n"
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

# API Test Functions
run_api_tests() {
    print_header "Running All API Tests"
    npx vitest run --reporter=verbose
    print_success "All API tests completed"
}

run_api_auth_tests() {
    print_subheader "API: Authentication Tests"
    npx vitest run tests/api/auth.test.ts --reporter=verbose
}

run_api_content_tests() {
    print_subheader "API: Content Tests"
    npx vitest run tests/api/content.test.ts --reporter=verbose
}

run_api_assessments_tests() {
    print_subheader "API: Assessments Tests"
    npx vitest run tests/api/assessments.test.ts --reporter=verbose
}

run_api_health_tests() {
    print_subheader "API: Health Check Tests"
    npx vitest run tests/api/health.test.ts --reporter=verbose
}

# E2E Test Functions
run_e2e_tests() {
    print_header "Running All E2E Tests"
    npx playwright test --reporter=list
    print_success "All E2E tests completed"
}

run_e2e_auth_tests() {
    print_subheader "E2E: Authentication Flow"
    npx playwright test tests/e2e/auth.spec.ts --reporter=list
}

run_e2e_library_tests() {
    print_subheader "E2E: Content Library"
    npx playwright test tests/e2e/library.spec.ts --reporter=list
}

run_e2e_pdf_tests() {
    print_subheader "E2E: PDF Generation"
    npx playwright test tests/e2e/pdf-generation.spec.ts --reporter=list
}

# UI Workflow Tests by Role
run_ui_clinician_tests() {
    print_header "Running Clinician Role UI Tests"
    npx playwright test tests/e2e/roles/clinician.spec.ts --reporter=list
    print_success "Clinician role tests completed"
}

run_ui_admin_tests() {
    print_header "Running Admin Role UI Tests"
    npx playwright test tests/e2e/roles/admin.spec.ts --reporter=list
    print_success "Admin role tests completed"
}

run_ui_unauthenticated_tests() {
    print_header "Running Unauthenticated User Tests"
    npx playwright test tests/e2e/roles/unauthenticated.spec.ts --reporter=list
    print_success "Unauthenticated user tests completed"
}

run_ui_patient_portal_tests() {
    print_header "Running Patient Portal Tests"
    npx playwright test tests/e2e/roles/patient-portal.spec.ts --reporter=list
    print_success "Patient portal tests completed"
}

# Comprehensive Test Suites
run_smoke_tests() {
    print_header "Running Smoke Tests (Quick Validation)"
    print_info "API health check..."
    npx vitest run tests/api/health.test.ts --reporter=verbose
    print_info "Basic E2E auth..."
    npx playwright test tests/e2e/auth.spec.ts --reporter=list
    print_success "Smoke tests passed"
}

run_full_functional_tests() {
    print_header "Running Full Functional Test Suite"
    
    print_info "Step 1/3: All API Tests..."
    npx vitest run --reporter=verbose
    print_success "API tests passed"
    
    echo ""
    
    print_info "Step 2/3: All E2E Tests..."
    npx playwright test --reporter=list
    print_success "E2E tests passed"
    
    echo ""
    
    print_info "Step 3/3: Role-Based UI Tests..."
    npx playwright test tests/e2e/roles/ --reporter=list
    print_success "Role-based tests passed"
    
    print_header "Full Functional Test Suite Complete!"
}

# Feature-specific test (for new development)
run_feature_test() {
    local feature_name=$1
    if [ -z "$feature_name" ]; then
        read -p "Enter feature name (e.g., pdf-generation, assessments): " feature_name
    fi
    
    print_header "Running Tests for Feature: $feature_name"
    
    # Check for matching API tests
    if ls tests/api/*${feature_name}*.test.ts 1> /dev/null 2>&1; then
        print_info "Found API tests..."
        npx vitest run tests/api/*${feature_name}*.test.ts --reporter=verbose
    fi
    
    # Check for matching E2E tests
    if ls tests/e2e/*${feature_name}*.spec.ts 1> /dev/null 2>&1; then
        print_info "Found E2E tests..."
        npx playwright test tests/e2e/*${feature_name}*.spec.ts --reporter=list
    fi
    
    print_success "Feature tests completed"
}

# Show help
show_help() {
    echo -e "${BLUE}DriverPath Test Runner${NC}"
    echo ""
    echo "Usage: ./scripts/test.sh [command]"
    echo ""
    echo -e "${CYAN}Quick Commands:${NC}"
    echo "  smoke          Run smoke tests (quick validation)"
    echo "  api            Run all API tests"
    echo "  e2e            Run all E2E browser tests"
    echo "  full           Run full functional test suite"
    echo ""
    echo -e "${CYAN}API Test Commands:${NC}"
    echo "  api:auth       Run authentication API tests"
    echo "  api:content    Run content API tests"
    echo "  api:assess     Run assessments API tests"
    echo "  api:health     Run health check tests"
    echo ""
    echo -e "${CYAN}E2E Test Commands:${NC}"
    echo "  e2e:auth       Run authentication E2E tests"
    echo "  e2e:library    Run content library E2E tests"
    echo "  e2e:pdf        Run PDF generation E2E tests"
    echo ""
    echo -e "${CYAN}Role-Based UI Tests:${NC}"
    echo "  ui:clinician   Run clinician role UI tests"
    echo "  ui:admin       Run admin role UI tests"
    echo "  ui:unauth      Run unauthenticated user tests"
    echo "  ui:patient     Run patient portal tests"
    echo ""
    echo -e "${CYAN}Development:${NC}"
    echo "  feature [name] Run tests for a specific feature"
    echo "  help           Show this help message"
    echo ""
    echo -e "${CYAN}Interactive:${NC}"
    echo "  (no args)      Launch interactive menu"
}

# Interactive menus
show_api_menu() {
    echo -e "\n${CYAN}API Tests Menu${NC}"
    echo "  1) All API Tests"
    echo "  2) Authentication"
    echo "  3) Content"
    echo "  4) Assessments"
    echo "  5) Health Check"
    echo "  6) Back to Main Menu"
    echo ""
    read -p "Select [1-6]: " choice
    
    case $choice in
        1) run_api_tests ;;
        2) run_api_auth_tests ;;
        3) run_api_content_tests ;;
        4) run_api_assessments_tests ;;
        5) run_api_health_tests ;;
        6) return ;;
        *) echo "Invalid choice" ;;
    esac
}

show_e2e_menu() {
    echo -e "\n${CYAN}E2E Browser Tests Menu${NC}"
    echo "  1) All E2E Tests"
    echo "  2) Authentication Flow"
    echo "  3) Content Library"
    echo "  4) PDF Generation"
    echo "  5) Back to Main Menu"
    echo ""
    read -p "Select [1-5]: " choice
    
    case $choice in
        1) run_e2e_tests ;;
        2) run_e2e_auth_tests ;;
        3) run_e2e_library_tests ;;
        4) run_e2e_pdf_tests ;;
        5) return ;;
        *) echo "Invalid choice" ;;
    esac
}

show_ui_roles_menu() {
    echo -e "\n${CYAN}UI Workflow Tests by Role${NC}"
    echo "  1) All Role Tests"
    echo "  2) Clinician Role"
    echo "  3) Admin Role"
    echo "  4) Unauthenticated Users"
    echo "  5) Patient Portal"
    echo "  6) Back to Main Menu"
    echo ""
    read -p "Select [1-6]: " choice
    
    case $choice in
        1) npx playwright test tests/e2e/roles/ --reporter=list ;;
        2) run_ui_clinician_tests ;;
        3) run_ui_admin_tests ;;
        4) run_ui_unauthenticated_tests ;;
        5) run_ui_patient_portal_tests ;;
        6) return ;;
        *) echo "Invalid choice" ;;
    esac
}

show_indepth_menu() {
    echo -e "\n${MAGENTA}╔════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║         IN-DEPTH TESTING OPTIONS           ║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Select Testing Category:${NC}"
    echo ""
    echo "  1) ${YELLOW}API Tests${NC} (Fast backend validation)"
    echo "     └─ Auth, Content, Assessments, Health"
    echo ""
    echo "  2) ${YELLOW}UI Workflow Tests${NC} (Browser-based)"
    echo "     └─ Auth, Library, PDF Generation"
    echo ""
    echo "  3) ${YELLOW}Role-Based Tests${NC} (By user type)"
    echo "     └─ Clinician, Admin, Unauthenticated, Patient"
    echo ""
    echo "  4) ${YELLOW}Full Functional${NC} (Everything)"
    echo "     └─ Complete test suite"
    echo ""
    echo "  5) ${YELLOW}Feature-Specific${NC} (Development)"
    echo "     └─ Test a specific feature by name"
    echo ""
    echo "  6) Back to Main Menu"
    echo ""
    read -p "Select [1-6]: " choice
    
    case $choice in
        1) show_api_menu ;;
        2) show_e2e_menu ;;
        3) show_ui_roles_menu ;;
        4) run_full_functional_tests ;;
        5) run_feature_test ;;
        6) return ;;
        *) echo "Invalid choice" ;;
    esac
}

show_main_menu() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       DRIVERPATH TEST RUNNER               ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Quick Options:${NC}"
    echo "  1) ${GREEN}Smoke Tests${NC} (Quick ~10s)"
    echo "  2) ${GREEN}API Tests${NC} (Fast ~5s)"
    echo "  3) ${GREEN}E2E Tests${NC} (Browser ~30s)"
    echo ""
    echo -e "${CYAN}Comprehensive:${NC}"
    echo "  4) ${YELLOW}In-Depth Testing${NC} (Granular options)"
    echo "  5) ${YELLOW}Full Functional${NC} (All tests)"
    echo ""
    echo -e "${CYAN}Other:${NC}"
    echo "  6) Help"
    echo "  7) Exit"
    echo ""
    read -p "Select [1-7]: " choice
    
    case $choice in
        1) run_smoke_tests ;;
        2) run_api_tests ;;
        3) run_e2e_tests ;;
        4) show_indepth_menu ;;
        5) run_full_functional_tests ;;
        6) show_help ;;
        7) echo "Exiting..."; exit 0 ;;
        *) echo "Invalid choice"; exit 1 ;;
    esac
}

# Main command handler
case "${1:-menu}" in
    smoke)
        run_smoke_tests
        ;;
    api)
        run_api_tests
        ;;
    api:auth)
        run_api_auth_tests
        ;;
    api:content)
        run_api_content_tests
        ;;
    api:assess|api:assessments)
        run_api_assessments_tests
        ;;
    api:health)
        run_api_health_tests
        ;;
    e2e)
        run_e2e_tests
        ;;
    e2e:auth)
        run_e2e_auth_tests
        ;;
    e2e:library)
        run_e2e_library_tests
        ;;
    e2e:pdf)
        run_e2e_pdf_tests
        ;;
    ui:clinician)
        run_ui_clinician_tests
        ;;
    ui:admin)
        run_ui_admin_tests
        ;;
    ui:unauth)
        run_ui_unauthenticated_tests
        ;;
    ui:patient)
        run_ui_patient_portal_tests
        ;;
    full|all)
        run_full_functional_tests
        ;;
    feature)
        run_feature_test "$2"
        ;;
    indepth|in-depth)
        show_indepth_menu
        ;;
    help|--help|-h)
        show_help
        ;;
    menu|*)
        show_main_menu
        ;;
esac
