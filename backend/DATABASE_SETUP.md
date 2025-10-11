# NexaFund Database Setup Guide

This guide will help you set up the PostgreSQL database for the NexaFund application.

## Prerequisites

1. **PostgreSQL installed and running**
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Make sure PostgreSQL service is running
   - Note down your PostgreSQL username, password, and port (default: 5432)

2. **Node.js and npm installed**
   - Download from [nodejs.org](https://nodejs.org/)
   - Make sure Node.js is added to your PATH

## Quick Setup (Automated)

### Option 1: Using PowerShell (Windows)
```powershell
# Navigate to backend directory
cd Nexafund_new-master/backend

# Run the automated setup script
.\setup-database.ps1
```

### Option 2: Using Node.js
```bash
# Navigate to backend directory
cd Nexafund_new-master/backend

# Run the automated setup script
node setup-database.js
```

## Manual Setup

If you prefer to run the commands manually:

### 1. Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/nexafund_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL="http://localhost:8080"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"
```

**Important:** Replace the following values:
- `username`: Your PostgreSQL username
- `password`: Your PostgreSQL password
- `nexafund_db`: Your desired database name
- `JWT_SECRET`: A secure random string for JWT signing

### 2. Create PostgreSQL Database

Connect to PostgreSQL and create the database:

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE nexafund_db;

-- Create a user (optional, you can use existing user)
CREATE USER nexafund_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nexafund_db TO nexafund_user;

-- Exit
\q
```

### 3. Install Dependencies and Setup Database

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations (creates all tables)
npm run db:migrate

# Seed the database with initial data
npx ts-node src/scripts/initializePermissions.ts
npx ts-node src/scripts/createSuperAdmin.ts
```

## Database Schema Overview

The database includes the following main entities:

- **Users**: User accounts with roles and permissions
- **Campaigns**: Crowdfunding campaigns
- **Contributions**: User contributions to campaigns
- **Milestones**: Campaign milestones for fund release
- **Reward Tiers**: Different contribution levels with rewards
- **Votes**: Community voting on milestones
- **Reports**: User reports on campaigns
- **Updates**: Campaign updates from creators

## Default Admin Account

After setup, you'll have a default super admin account:

- **Email**: admin@nexafund.com
- **Password**: admin123
- **Role**: SUPER_ADMIN

⚠️ **Important**: Change these credentials after first login!

## Useful Commands

```bash
# Start the development server
npm run dev

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset the database (WARNING: deletes all data)
npm run db:push --force-reset

# Generate Prisma client after schema changes
npm run db:generate

# Create a new migration
npm run db:migrate

# View database status
npx prisma migrate status
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Make sure PostgreSQL is running
   - Check if the port (5432) is correct
   - Verify username and password

2. **Database does not exist**
   - Create the database manually in PostgreSQL
   - Update the DATABASE_URL in .env file

3. **Permission denied**
   - Make sure the user has proper privileges
   - Try connecting as superuser first

4. **Migration errors**
   - Check if the database is empty
   - Try running `npm run db:push` instead of migrate

### Getting Help

- Check the Prisma documentation: [prisma.io/docs](https://www.prisma.io/docs)
- PostgreSQL documentation: [postgresql.org/docs](https://www.postgresql.org/docs)

## Next Steps

After successful database setup:

1. Start the backend server: `npm run dev`
2. Test the API endpoints
3. Set up the frontend application
4. Configure blockchain integration
5. Deploy to production

## Security Notes

- Never commit the `.env` file to version control
- Use strong passwords for database users
- Change default admin credentials
- Use environment-specific JWT secrets
- Enable SSL for production database connections
