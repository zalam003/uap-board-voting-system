#!/bin/bash

# UAP Board Voting System - Secure Deployment Script
# This script ensures secure deployment to Vercel with all security measures

set -e

echo "🔒 UAP Board Voting System - Secure Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo -e "\n📋 Checking Prerequisites..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Install with: npm i -g vercel"
    exit 1
fi
print_status "Vercel CLI is installed"

# Check if required files exist
required_files=("middleware.ts" "next.config.js" "vercel.json" ".env.example")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done
print_status "All required security files present"

# Security Configuration Validation
echo -e "\n🔒 Validating Security Configuration..."

# Check middleware.ts for security headers
if grep -q "X-Content-Type-Options" middleware.ts; then
    print_status "Security headers configured in middleware"
else
    print_error "Security headers missing in middleware.ts"
    exit 1
fi

# Check vercel.json for HTTPS redirects
if grep -q "x-forwarded-proto" vercel.json; then
    print_status "HTTPS redirects configured"
else
    print_warning "HTTPS redirects not found in vercel.json"
fi

# Check Next.js config for security
if grep -q "poweredByHeader: false" next.config.js; then
    print_status "Next.js security headers configured"
else
    print_warning "Consider adding security headers to next.config.js"
fi

# Environment Variables Check
echo -e "\n🔑 Environment Variables Validation..."

# Check if .env.local exists for development
if [[ -f ".env.local" ]]; then
    print_status ".env.local found for development"
    
    # Check for critical environment variables
    required_env_vars=("ADMIN_SECRET" "JWT_SECRET" "DATABASE_URL")
    for var in "${required_env_vars[@]}"; do
        if grep -q "^${var}=" .env.local; then
            print_status "$var is configured"
        else
            print_warning "$var not found in .env.local"
        fi
    done
else
    print_warning ".env.local not found - ensure environment variables are set in Vercel"
fi

# Build and Test
echo -e "\n🔨 Building Application..."

# Install dependencies
npm install
print_status "Dependencies installed"

# Run build
npm run build
if [[ $? -eq 0 ]]; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# Run tests if they exist
if [[ -f "package.json" ]] && npm run | grep -q "test"; then
    npm test
    if [[ $? -eq 0 ]]; then
        print_status "Tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
fi

# Security Header Test
echo -e "\n🛡️ Security Validation..."

# Start local server for testing
npm run dev &
SERVER_PID=$!
sleep 5

# Test security headers (requires curl)
if command -v curl &> /dev/null; then
    echo "Testing security headers on local server..."
    
    # Test CORS headers
    cors_test=$(curl -s -I -X OPTIONS \
        -H "Origin: https://malicious-site.com" \
        -H "Access-Control-Request-Method: POST" \
        http://localhost:3000/api/admin/sessions)
    
    if echo "$cors_test" | grep -q "Access-Control-Allow-Origin"; then
        print_status "CORS headers present"
    else
        print_warning "CORS headers not detected in local test"
    fi
    
    # Test security headers
    security_test=$(curl -s -I http://localhost:3000/)
    
    security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
    for header in "${security_headers[@]}"; do
        if echo "$security_test" | grep -q "$header"; then
            print_status "$header present"
        else
            print_warning "$header not detected"
        fi
    done
    
    # Stop local server
    kill $SERVER_PID
else
    print_warning "curl not available - skipping local security header tests"
fi

# Deployment Preparation
echo -e "\n🚀 Preparing for Deployment..."

# Prompt for production domain update
echo -e "\n${YELLOW}Important:${NC} Update the following before deployment:"
echo "1. Replace 'uap-board-voting.vercel.app' with your actual domain in:"
echo "   - middleware.ts (CORS origins)"
echo "   - vercel.json (redirects)"
echo "   - next.config.js (redirects)"
echo ""
echo "2. Set environment variables in Vercel dashboard:"
echo "   - ADMIN_SECRET (32+ character random string)"
echo "   - JWT_SECRET (64+ character random string)"
echo "   - DATABASE_URL (production database)"
echo "   - GMAIL_USER and GMAIL_APP_PASSWORD"
echo ""

read -p "Have you updated the domain and set environment variables? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please update configuration before deploying"
    exit 1
fi

# Deploy to Vercel
echo -e "\n🌐 Deploying to Vercel..."

vercel --prod
if [[ $? -eq 0 ]]; then
    print_status "Deployment successful!"
else
    print_error "Deployment failed"
    exit 1
fi

# Post-deployment verification
echo -e "\n✅ Post-Deployment Security Checklist:"
echo "1. Test HTTPS enforcement: curl -I http://your-domain.com"
echo "2. Verify security headers: https://securityheaders.com"
echo "3. Check SSL grade: https://www.ssllabs.com/ssltest/"
echo "4. Test CORS policy from browser console"
echo "5. Verify rate limiting with multiple requests"
echo "6. Test admin authentication flow"
echo "7. Validate voting process end-to-end"
echo ""

print_status "Deployment completed successfully!"
echo -e "${GREEN}🎉 UAP Board Voting System is now securely deployed!${NC}"
echo ""
echo "Next steps:"
echo "- Monitor deployment logs"
echo "- Test all functionality in production"
echo "- Set up monitoring and alerting"
echo "- Schedule regular security audits"
