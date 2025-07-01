# UAP Board Voting System - JWT-Based Implementation

A secure, modern voting system for the University of Asia Pacific Board of Directors elections, built with Next.js, TypeScript, and JWT authentication.

## 🚀 Features

### Core Functionality
- **JWT-Based Authentication**: Secure email-based voting with one-hour time windows
- **Candidate Management**: Admin interface for managing candidates and elections
- **Bulk Email Invitations**: CSV upload and automated email distribution
- **Real-Time Results**: Live vote tallies and comprehensive result dashboards
- **Anonymous Voting**: Vote privacy with verification codes for receipts

### Security Features
- **Email Verification**: Pre-authorized voter lists with unique JWT tokens
- **Vote Anonymization**: Voter identity separated from vote choices
- **Audit Trail**: Complete logging of all system actions
- **IP Tracking**: Security monitoring for fraud detection
- **Time-Limited Voting**: Automatic session expiration

### Administrative Tools
- **Session Management**: Create and manage multiple voting sessions
- **Voter Management**: Upload voter lists via CSV
- **Results Export**: Download detailed results in CSV format
- **Real-Time Monitoring**: Live dashboards showing voting progress

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 with TypeScript and React 18
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with connection pooling
- **Email**: Gmail SMTP for automated email delivery
- **Authentication**: JWT tokens with email-based verification
- **Deployment**: Optimized for Vercel

### Project Structure
```
uap-board-voting-system/
├── app/                        # Next.js App Router
│   ├── api/                   # Backend API Routes
│   │   ├── admin/             
│   │   │   ├── sessions/route.ts     # Session management
│   │   │   ├── candidates/route.ts   # Candidate management  
│   │   │   ├── voters/route.ts       # Voter management
│   │   │   └── results/route.ts      # Results & export
│   │   ├── vote/route.ts             # Voting endpoints
│   │   └── health/route.ts           # Health monitoring ✨
│   ├── admin/page.tsx              # Admin dashboard
│   ├── vote/page.tsx               # Voting interface
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # App layout
│   └── globals.css                 # Styling
├── lib/                           # Core Libraries
│   ├── database.ts               # Database operations
│   ├── email.ts                  # Gmail SMTP email functions
│   └── utils.ts                  # JWT, crypto, validation
├── scripts/                      # Development Scripts
│   ├── docker/                   # Docker startup scripts ✨
│   │   ├── start-docker.sh       # Linux/Mac startup
│   │   └── start-docker.bat      # Windows startup
│   └── setup-db.js              # Database setup and migrations
├── docker/                       # 🐳 Docker Configuration ✨
│   ├── docker-compose.yml       # Production config
│   ├── docker-compose.dev.yml   # Development overrides
│   ├── Dockerfile               # Multi-stage builds
│   ├── Makefile                 # Docker commands
│   ├── init-scripts/            # Database initialization
│   └── README.md                # Docker documentation
├── database/                     # Database Migrations
├── public/                       # Static assets
├── .dockerignore                # Docker optimization ✨
├── docker-helper.sh             # Quick Docker access ✨
├── docker-helper.bat            # Windows Docker helper ✨
├── package.json                 # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
├── vercel.json                 # Vercel deployment config
├── .env.example                # Environment template
└── README.md                   # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- **PostgreSQL 12+** database server
- Gmail account with App Password for SMTP

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd uap-board-voting-system
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # PostgreSQL Database
   DATABASE_URL=postgresql://username:password@localhost:5432/uap_voting
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ADMIN_SECRET=your-admin-password
   
   # Gmail SMTP
   GMAIL_USER=your-gmail-address@gmail.com
   GMAIL_APP_PASSWORD=your-gmail-app-password
   FROM_EMAIL=your-gmail-address@gmail.com
   
   # URLs
   FRONTEND_URL=http://localhost:3000
   ```

3. **Initialize Database**
   ```bash
   npm run setup-db
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## 🐳 Docker Setup (Recommended)

For the easiest setup experience, use Docker which handles all dependencies automatically:

### Quick Start with Docker

**Option 1: Interactive Helper Scripts**
```bash
# Linux/Mac
./docker-helper.sh

# Windows
docker-helper.bat
```

**Option 2: Quick Start Scripts**
```bash
# Linux/Mac
./scripts/docker/start-docker.sh

# Windows
scripts\docker\start-docker.bat
```

**Option 3: Make Commands (from docker/ directory)**
```bash
cd docker

# Development environment
make dev

# Production environment  
make prod

# View logs
make logs

# Stop services
make down
```

### Docker Benefits
- ✅ **No local PostgreSQL installation needed**
- ✅ **Automatic database initialization**
- ✅ **Consistent environment across all systems**
- ✅ **Includes pgAdmin for database management**
- ✅ **Health monitoring and auto-restart**
- ✅ **Easy backup and restore**

### Access Points (Docker)
- **Application**: http://localhost:3000
- **pgAdmin**: http://localhost:5050 (admin@uap-bd.edu / admin)
- **Health Check**: http://localhost:3000/api/health

📖 **For detailed Docker documentation, see [docker/README.md](docker/README.md)**

## 📧 Gmail SMTP Setup

### **Setting up Gmail App Password**

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Enable 2-Factor Authentication if not already enabled

2. **Generate App Password**
   - In Google Account settings, go to Security
   - Under "2-Step Verification", click "App passwords"
   - Select "Mail" as the app and your device
   - Copy the generated 16-character password

3. **Configure Environment Variables**
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   FROM_EMAIL=your-email@gmail.com
   ```

4. **Test Email Configuration**
   - Access the admin panel at `/admin`
   - Check the "Email Configuration" section
   - Send a test email to verify setup

### **Gmail SMTP Benefits**
- ✅ **Free**: No additional email service costs
- ✅ **Reliable**: Google's robust infrastructure
- ✅ **Secure**: OAuth2 and App Password authentication
- ✅ **High Deliverability**: Trusted sending reputation

## 🐘 PostgreSQL Database Setup

### **Installing PostgreSQL**

#### **On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **On macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or using Postgres.app (GUI)
# Download from: https://postgresapp.com/
```

#### **On Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run installer and follow setup wizard
- Remember the password for the `postgres` user

### **Setting up the Database**

1. **Create Database User**
   ```bash
   # Connect to PostgreSQL as superuser
   sudo -u postgres psql
   
   # Create user and database
   CREATE USER uap_voting WITH PASSWORD 'your_secure_password';
   CREATE DATABASE uap_voting OWNER uap_voting;
   GRANT ALL PRIVILEGES ON DATABASE uap_voting TO uap_voting;
   
   # Exit PostgreSQL
   \q
   ```

2. **Test Connection**
   ```bash
   psql -h localhost -U uap_voting -d uap_voting
   # Enter password when prompted
   ```

3. **Configure Environment**
   ```env
   DATABASE_URL=postgresql://uap_voting:your_secure_password@localhost:5432/uap_voting
   ```

4. **Run Database Setup**
   ```bash
   # Create database and run migrations
   npm run create-db
   
   # Or if database already exists
   npm run setup-db
   ```

### **Cloud PostgreSQL Options**

#### **Vercel Postgres (Recommended for Vercel deployment)**
```bash
# Install Vercel CLI
npm i -g vercel

# Create Postgres database
vercel postgres create uap-voting-db

# Get connection string from Vercel dashboard
```

#### **Other Cloud Providers**
- **Heroku Postgres**: Heroku add-on with automatic connection string
- **DigitalOcean Managed Database**: Fully managed PostgreSQL
- **AWS RDS**: Amazon's managed PostgreSQL service
- **Google Cloud SQL**: Google's managed PostgreSQL service

### **PostgreSQL Benefits**
- ✅ **Production Ready**: ACID compliance and reliability
- ✅ **Scalable**: Handles thousands of concurrent voters
- ✅ **Advanced Features**: JSON support, full-text search, advanced indexing
- ✅ **Security**: Role-based access control and SSL support
- ✅ **Performance**: Connection pooling and query optimization

## 📋 Usage Guide

### For Administrators

1. **Access Admin Panel**
   - Go to `/admin`
   - Enter admin password (from `ADMIN_SECRET`)

2. **Create Voting Session**
   - Click "Create New Session"
   - Enter title and description
   - Session starts in "draft" mode

3. **Add Candidates**
   - Select your session
   - Add candidate names and descriptions
   - Candidates are automatically ordered

4. **Upload Voters**
   - Prepare CSV file with email addresses (one per line)
   - Upload via admin interface
   - Emails are sent automatically with voting links

5. **Activate Voting**
   - Click "Activate Voting" when ready
   - Voting becomes live for one hour
   - Monitor results in real-time

6. **View Results**
   - Real-time vote tallies
   - Winner determination
   - Export detailed CSV reports

### For Voters

1. **Receive Email Invitation**
   - Check email for voting invitation
   - Click the secure voting link

2. **Cast Vote**
   - Review candidates
   - Select your choice
   - Submit vote (cannot be changed)

3. **Confirmation**
   - Receive verification code
   - Confirmation email sent
   - Vote is anonymous and secure

## 🔐 Security Features

### JWT Implementation
- **One-Hour Expiration**: Voting links automatically expire
- **Voter-Specific Tokens**: Each voter gets a unique JWT
- **Hash Storage**: Tokens are hashed before database storage
- **Purpose Validation**: Tokens are purpose-specific for voting

### Vote Anonymization
- **Voter Hash**: Email addresses are hashed for anonymity
- **Separated Storage**: Vote choices stored separately from voter identity
- **Verification Codes**: Each vote gets a unique receipt code
- **No Re-identification**: System designed to prevent vote tracing

### Audit and Monitoring
- **Complete Audit Trail**: All actions logged with timestamps
- **IP Address Tracking**: Security monitoring for unusual activity
- **Admin Action Logging**: All administrative actions recorded
- **Database Integrity**: Foreign key constraints and data validation

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Push code to GitHub
   - Connect to Vercel

2. **Environment Variables**
   Set in Vercel dashboard:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=production-secret
   ADMIN_SECRET=production-admin-password
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   FROM_EMAIL=your-gmail@gmail.com
   FRONTEND_URL=https://your-domain.vercel.app
   ```

3. **Database Setup**
   - Use PostgreSQL for production
   - Run migration scripts on production database

4. **Deploy**
   - Push to main branch
   - Vercel automatically deploys

### Production Considerations
- Use strong JWT secrets (64+ characters)
- Enable database connection pooling
- Set up monitoring and alerting
- Regular database backups
- Rate limiting for API endpoints

## 📊 Database Schema

### Key Tables
- **voting_sessions**: Election management
- **candidates**: Candidate information
- **authorized_voters**: Pre-approved voter list
- **encrypted_votes**: Anonymous vote storage
- **audit_logs**: Complete audit trail

### Migration Scripts
Located in `database/`:
- `001_initial_schema.sql` - PostgreSQL database schema
- `002_seed_data.sql` - PostgreSQL seed data with sample election

## 🔧 Development

### API Endpoints

#### Admin APIs
- `GET /api/admin/sessions` - List voting sessions
- `POST /api/admin/sessions` - Create new session
- `PUT /api/admin/sessions` - Update session
- `GET /api/admin/candidates` - List candidates
- `POST /api/admin/candidates` - Add candidate
- `POST /api/admin/voters` - Upload voters and send emails
- `GET /api/admin/results` - Get election results

#### Voting APIs
- `GET /api/vote?token=xxx` - Get voting information
- `POST /api/vote` - Submit vote

### Testing
```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Reset database for testing
npm run db:reset
```

## 🔍 Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check `GMAIL_USER` and `GMAIL_APP_PASSWORD` environment variables
   - Ensure 2-Factor Authentication is enabled on Gmail
   - Verify the App Password is correctly generated and copied
   - Use the admin panel email test feature
   - Check that `FROM_EMAIL` matches `GMAIL_USER`

2. **Database Connection**
   - Verify `DATABASE_URL` format: `postgresql://username:password@host:port/database`
   - Check if PostgreSQL server is running: `sudo systemctl status postgresql`
   - Test connection: `psql $DATABASE_URL -c "SELECT 1"`
   - Verify database exists: `psql -l` to list databases
   - Check user permissions: ensure user can CREATE, SELECT, INSERT, UPDATE, DELETE

3. **JWT Errors**
   - Ensure `JWT_SECRET` is set
   - Check token expiration (1 hour limit)
   - Verify token format in emails

4. **Voting Link Issues**
   - Check `FRONTEND_URL` configuration
   - Ensure HTTPS in production
   - Verify email link format

### Logs and Monitoring
- Check browser console for frontend errors
- Review Vercel function logs for API issues
- Monitor database for constraint violations
- Check audit logs for security events

## 📈 Performance

### Optimization Features
- Serverless API routes for auto-scaling
- Database connection pooling
- Batch email processing with rate limiting
- Optimized database queries with indexes
- Efficient frontend bundle splitting

### Scaling Considerations
- Email sending rate limits (Gmail SMTP: ~5 emails/second)
- Database connection limits
- JWT token payload size
- File upload size limits for CSV

## 🛡️ Security Best Practices

### Implemented
- ✅ JWT token expiration (1 hour)
- ✅ Email address validation
- ✅ Admin secret authentication
- ✅ Vote anonymization
- ✅ Complete audit trails
- ✅ IP address logging
- ✅ Input sanitization
- ✅ SQL injection prevention

### Additional Recommendations
- Regular security audits
- Penetration testing before elections
- Multi-factor authentication for admins
- Rate limiting on API endpoints
- Database encryption at rest
- SSL/TLS certificate monitoring

## 📞 Support

For technical issues or questions:
1. Check this documentation
2. Review audit logs for system events
3. Contact the system administrator
4. Check Vercel deployment logs

---

**University of Asia Pacific**  
**Digital Voting System v2.0**  
**Secure • Transparent • Reliable**
