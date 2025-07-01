@echo off
setlocal EnableDelayedExpansion

rem UAP Board Voting System - Docker Helper Script (Windows)
rem This script provides quick access to Docker commands from the root directory

echo 🗳️  UAP Board Voting System - Docker Helper
echo ===========================================
echo.
echo Docker files have been organized in the \docker directory.
echo Choose an option:
echo.
echo 1) Quick start (development)
echo 2) Quick start (production)
echo 3) Open Docker directory
echo 4) View Docker documentation
echo 5) Show Docker commands
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Starting development environment...
    call scripts\docker\start-docker.bat
) else if "%choice%"=="2" (
    echo Starting production environment...
    cd docker && docker-compose up -d && cd ..
) else if "%choice%"=="3" (
    echo Opening Docker directory...
    echo You are now in the Docker directory. Available commands:
    echo   make dev      - Start development
    echo   make prod     - Start production
    echo   make logs     - View logs
    echo   make down     - Stop services
    cd docker
    cmd /k
) else if "%choice%"=="4" (
    echo Opening Docker documentation...
    where code >nul 2>&1
    if %errorlevel% equ 0 (
        code docker\README.md
    ) else (
        where notepad >nul 2>&1
        if %errorlevel% equ 0 (
            notepad docker\README.md
        ) else (
            type docker\README.md
        )
    )
) else if "%choice%"=="5" (
    echo Available Docker commands:
    echo.
    echo 📁 From \docker directory:
    echo   make dev          # Start development environment
    echo   make prod         # Start production environment
    echo   make logs         # View all logs
    echo   make down         # Stop all services
    echo   make clean        # Remove containers/images
    echo   make health       # Check service health
    echo.
    echo 📁 From project root:
    echo   scripts\docker\start-docker.bat     # Quick start script
    echo   docker-compose -f docker\docker-compose.yml up -d
    echo.
    echo 📖 See docker\README.md for full documentation
) else (
    echo Invalid choice. Please run again and choose 1-5.
)

pause
