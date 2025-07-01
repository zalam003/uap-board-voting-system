#!/bin/bash

# UAP Board Voting System - Quick Start Script
# This script helps you get the Docker environment up and running quickly

set -e

echo "🗳️  UAP Board Voting System - Docker Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f "../../docker/.env" ]; then
    echo "📝 Creating environment configuration file..."
    cp ../../docker/.env.example ../../docker/.env
    echo "✅ Created docker/.env from template"
    echo ""
    echo "⚠️  IMPORTANT: Please edit docker/.env with your configuration"
    echo "   - Set secure passwords"
    echo "   - Configure Gmail SMTP settings"
    echo "   - Update JWT secrets"
    echo ""
    read -p "Press Enter to continue after editing docker/.env file..."
    echo ""
fi

# Ask user for environment type
echo "🚀 Which environment would you like to start?"
echo "1) Development (recommended for development)"
echo "2) Production (for production deployment)"
echo ""
read -p "Enter your choice (1 or 2): " env_choice

case $env_choice in
    1)
        echo ""
        echo "🔧 Starting Development Environment..."
        echo "This will:"
        echo "  - Build development containers"
        echo "  - Enable hot reloading"
        echo "  - Mount source code as volumes"
        echo "  - Expose database port for debugging"
        echo ""
        
        if command -v make &> /dev/null; then
            cd ../../docker && make dev-build
        else
            cd ../.. && docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build
        fi
        
        echo ""
        echo "✅ Development environment started!"
        echo ""
        echo "🌐 Access your application:"
        echo "   Application: http://localhost:3000"
        echo "   pgAdmin:     http://localhost:5050"
        echo ""
        echo "📊 Useful commands:"
        if command -v make &> /dev/null; then
            echo "   View logs:   cd ../../docker && make dev-logs"
            echo "   Stop:        cd ../../docker && make dev-down"
            echo "   Shell:       cd ../../docker && make shell"
            echo "   DB Shell:    cd ../../docker && make db-shell"
        else
            echo "   View logs:   cd ../.. && docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f"
            echo "   Stop:        cd ../.. && docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down"
        fi
        ;;
        
    2)
        echo ""
        echo "🏭 Starting Production Environment..."
        echo "This will:"
        echo "  - Build optimized production containers"
        echo "  - Use production-ready configurations"
        echo "  - Enable health checks and restart policies"
        echo ""
        
        if command -v make &> /dev/null; then
            cd ../../docker && make prod-build
        else
            cd ../../docker && docker-compose up -d --build
        fi
        
        echo ""
        echo "✅ Production environment started!"
        echo ""
        echo "🌐 Access your application:"
        echo "   Application: http://localhost:3000"
        echo ""
        echo "📊 Useful commands:"
        if command -v make &> /dev/null; then
            echo "   View logs:   cd ../../docker && make prod-logs"
            echo "   Stop:        cd ../../docker && make prod-down"
            echo "   Status:      cd ../../docker && make status"
            echo "   Health:      cd ../../docker && make health"
        else
            echo "   View logs:   cd ../../docker && docker-compose logs -f"
            echo "   Stop:        cd ../../docker && docker-compose down"
        fi
        ;;
        
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "📖 For more detailed information, see:"
echo "   - docker/README.md"
echo "   - Project README.md"
echo ""
echo "🎉 Happy voting! 🗳️"
