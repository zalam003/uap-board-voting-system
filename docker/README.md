# UAP Board Voting System - Docker Setup

This directory contains Docker configuration files for the UAP Board Voting System, providing a complete containerized environment for both development and production.

## 🏗️ Architecture

The Docker setup includes:

- **Next.js Application**: The main voting system application
- **PostgreSQL Database**: Primary data storage
- **pgAdmin**: Optional database management interface
- **Multi-stage Dockerfile**: Optimized builds for development and production

## 📋 Prerequisites

Before running the application, ensure you have:

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- At least 4GB of available RAM
- Ports 3000, 5432, and 5050 available

## 🚀 Quick Start

### Development Environment

1. **Clone and navigate to the project:**
   ```bash
   cd uap-board-voting-system
   ```

2. **Set up environment variables:**
   ```bash
   cp docker/.env.example docker/.env
   # Edit docker/.env with your configuration
   ```

3. **Start development environment:**
   ```bash
   # Using Makefile (recommended)
   make dev
   
   # Or using docker-compose directly
   docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d
   ```

4. **Access the application:**
   - Application: http://localhost:3000
   - pgAdmin: http://localhost:5050 (admin@uap-bd.edu / admin)

### Production Environment

1. **Configure production environment:**
   ```bash
   cp docker/.env.example docker/.env
   # Update docker/.env with production values
   ```

2. **Start production environment:**
   ```bash
   # Using Makefile (recommended)
   make prod
   
   # Or using docker-compose directly
   cd docker && docker-compose up -d
   ```

## 🔧 Configuration

### Environment Variables

Key environment variables in `docker/.env`:

```env
# Database
DB_PASSWORD=secure_password_here

# Application Security
JWT_SECRET=your-super-secret-jwt-key
ADMIN_SECRET=admin-password

# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### Gmail SMTP Setup

For email functionality, you need to set up Gmail App Passwords:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use this password in `GMAIL_APP_PASSWORD`

## 🛠️ Available Commands

### Using Makefile (Recommended)

```bash
# Development
make dev          # Start development environment
make dev-build    # Build and start development
make dev-logs     # View development logs

# Production
make prod         # Start production environment
make prod-build   # Build and start production
make prod-logs    # View production logs

# General
make status       # Show running containers
make logs         # View all logs
make down         # Stop all services
make clean        # Remove containers and images
make reset        # Clean and rebuild everything

# Database
make db-shell     # Access PostgreSQL shell
make backup-db    # Create database backup
make pgadmin      # Start pgAdmin interface

# Utilities
make shell        # Access application container
make health       # Check service health
```

### Using Docker Compose Directly

```bash
# Development
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up -d

# Production
cd docker && docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 File Structure

```
docker/
├── docker-compose.yml       # Main compose configuration
├── docker-compose.dev.yml   # Development overrides
├── Dockerfile              # Multi-stage application build
├── .env.example            # Environment template
├── pgadmin-servers.json    # pgAdmin server configuration
└── init-scripts/
    └── 01-init-database.sh # Database initialization
```

## 🗄️ Database

### Initialization

The database is automatically initialized with:
- Schema from `database/001_initial_schema.sql`
- Seed data from `database/002_seed_data.sql`

### Management

Access database directly:
```bash
# Using Makefile
make db-shell

# Using docker exec
docker exec -it uap-voting-postgres psql -U uap_voting -d uap_voting
```

Use pgAdmin web interface:
```bash
make pgadmin
# Access: http://localhost:5050
```

### Backup and Restore

```bash
# Create backup
make backup-db

# Restore from backup
make restore-db
```

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep -E ':(3000|5432|5050)'
   
   # Change ports in docker/.env
   APP_PORT=3001
   DB_PORT=5433
   PGADMIN_PORT=5051
   ```

2. **Permission issues:**
   ```bash
   # Reset Docker volumes
   make clean
   make dev
   ```

3. **Database connection issues:**
   ```bash
   # Check database health
   docker exec uap-voting-postgres pg_isready -U uap_voting -d uap_voting
   
   # View database logs
   docker logs uap-voting-postgres
   ```

4. **Application not starting:**
   ```bash
   # Check application logs
   docker logs uap-voting-app
   
   # Rebuild application
   make dev-build
   ```

### Health Checks

The setup includes health checks for all services:

```bash
# Check all service health
make health

# View service status
make status
```

### Logs

```bash
# View all logs
make logs

# View specific service logs
docker logs uap-voting-app
docker logs uap-voting-postgres
```

## 🔐 Security Considerations

### Development
- Default passwords are used
- Database port is exposed
- Debug logging enabled

### Production
- Change all default passwords
- Use strong JWT secrets
- Configure proper email credentials
- Consider using Docker secrets for sensitive data
- Database port not exposed externally
- Health checks and restart policies enabled

## 📈 Performance Optimization

### Development
- Hot reloading enabled
- Source code mounted as volume
- Development dependencies included

### Production
- Multi-stage build for smaller images
- Production-optimized Next.js build
- No development dependencies
- Health checks for reliability

## 🤝 Contributing

When making changes to Docker configuration:

1. Test in development environment first
2. Update documentation if needed
3. Test production build
4. Update version numbers appropriately

## 📞 Support

For Docker-related issues:
- Check logs using `make logs`
- Verify environment configuration
- Ensure all prerequisites are met
- Check Docker and Docker Compose versions
