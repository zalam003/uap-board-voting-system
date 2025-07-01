@echo off
setlocal EnableDelayedExpansion

rem UAP Board Voting System - Quick Start Script (Windows)
rem This script helps you get the Docker environment up and running quickly

echo 🗳️  UAP Board Voting System - Docker Setup
echo ==========================================
echo.

rem Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

rem Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    echo Visit: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed
echo.

rem Check if .env file exists
if not exist "..\..\docker\.env" (
    echo 📝 Creating environment configuration file...
    copy "..\..\docker\.env.example" "..\..\docker\.env" >nul
    echo ✅ Created docker\.env from template
    echo.
    echo ⚠️  IMPORTANT: Please edit docker\.env with your configuration
    echo    - Set secure passwords
    echo    - Configure Gmail SMTP settings
    echo    - Update JWT secrets
    echo.
    pause
    echo.
)

rem Ask user for environment type
echo 🚀 Which environment would you like to start?
echo 1) Development (recommended for development)
echo 2) Production (for production deployment)
echo.
set /p env_choice="Enter your choice (1 or 2): "

if "%env_choice%"=="1" (
    echo.
    echo 🔧 Starting Development Environment...
    echo This will:
    echo   - Build development containers
    echo   - Enable hot reloading
    echo   - Mount source code as volumes
    echo   - Expose database port for debugging
    echo.
    
    rem Check if make is available (Windows Subsystem for Linux or Git Bash)
    where make >nul 2>&1
    if %errorlevel% equ 0 (
        cd ..\..\docker && make dev-build
    ) else (
        cd ..\.. && docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d --build
    )
    
    echo.
    echo ✅ Development environment started!
    echo.
    echo 🌐 Access your application:
    echo    Application: http://localhost:3000
    echo    pgAdmin:     http://localhost:5050
    echo.
    echo 📊 Useful commands:
    where make >nul 2>&1
    if %errorlevel% equ 0 (
        echo    View logs:   make dev-logs
        echo    Stop:        make dev-down
        echo    Shell:       make shell
        echo    DB Shell:    make db-shell
    ) else (
        echo    View logs:   docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml logs -f
        echo    Stop:        docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml down
    )
    
) else if "%env_choice%"=="2" (
    echo.
    echo 🏭 Starting Production Environment...
    echo This will:
    echo   - Build optimized production containers
    echo   - Use production-ready configurations
    echo   - Enable health checks and restart policies
    echo.
    
    rem Check if make is available
    where make >nul 2>&1
    if %errorlevel% equ 0 (
        cd ..\..\docker && make prod-build
    ) else (
        cd ..\..\docker && docker-compose up -d --build
    )
    
    echo.
    echo ✅ Production environment started!
    echo.
    echo 🌐 Access your application:
    echo    Application: http://localhost:3000
    echo.
    echo 📊 Useful commands:
    where make >nul 2>&1
    if %errorlevel% equ 0 (
        echo    View logs:   make prod-logs
        echo    Stop:        make prod-down
        echo    Status:      make status
        echo    Health:      make health
    ) else (
        echo    View logs:   cd docker ^&^& docker-compose logs -f
        echo    Stop:        cd docker ^&^& docker-compose down
    )
    
) else (
    echo ❌ Invalid choice. Please run the script again and choose 1 or 2.
    pause
    exit /b 1
)

echo.
echo 📖 For more detailed information, see:
echo    - docker\README.md
echo    - Project README.md
echo.
echo 🎉 Happy voting! 🗳️
pause
