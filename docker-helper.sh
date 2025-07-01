#!/bin/bash
# UAP Board Voting System - Docker Helper Script
# This script provides quick access to Docker commands from the root directory

echo "🗳️  UAP Board Voting System - Docker Helper"
echo "==========================================="
echo ""
echo "Docker files have been organized in the /docker directory."
echo "Choose an option:"
echo ""
echo "1) Quick start (development)"
echo "2) Quick start (production)"
echo "3) Open Docker directory"
echo "4) View Docker documentation"
echo "5) Show Docker commands"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Starting development environment..."
        ./scripts/docker/start-docker.sh
        ;;
    2)
        echo "Starting production environment..."
        cd docker && docker-compose up -d
        ;;
    3)
        echo "Opening Docker directory..."
        cd docker
        echo "You are now in the Docker directory. Available commands:"
        echo "  make dev      - Start development"
        echo "  make prod     - Start production" 
        echo "  make logs     - View logs"
        echo "  make down     - Stop services"
        $SHELL
        ;;
    4)
        echo "Opening Docker documentation..."
        if command -v code &> /dev/null; then
            code docker/README.md
        elif command -v nano &> /dev/null; then
            nano docker/README.md
        else
            cat docker/README.md
        fi
        ;;
    5)
        echo "Available Docker commands:"
        echo ""
        echo "📁 From /docker directory:"
        echo "  make dev          # Start development environment"
        echo "  make prod         # Start production environment"
        echo "  make logs         # View all logs"
        echo "  make down         # Stop all services"
        echo "  make clean        # Remove containers/images"
        echo "  make health       # Check service health"
        echo ""
        echo "📁 From project root:"
        echo "  ./scripts/docker/start-docker.sh    # Quick start script"
        echo "  docker-compose -f docker/docker-compose.yml up -d"
        echo ""
        echo "📖 See docker/README.md for full documentation"
        ;;
    *)
        echo "Invalid choice. Please run again and choose 1-5."
        ;;
esac
