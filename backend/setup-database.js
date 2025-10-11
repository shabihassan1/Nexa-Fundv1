#!/usr/bin/env node

/**
 * Database Setup Script for NexaFund
 * 
 * This script will:
 * 1. Check if .env file exists
 * 2. Install dependencies
 * 3. Generate Prisma client
 * 4. Run database migrations
 * 5. Seed the database with initial data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting NexaFund Database Setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Please create a .env file with the following content:');
  console.log(`
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
  `);
  console.log('\n⚠️  Replace username, password, and nexafund_db with your actual PostgreSQL credentials!');
  process.exit(1);
}

console.log('✅ .env file found');

// Function to run commands with error handling
function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    process.exit(1);
  }
}

try {
  // Step 1: Install dependencies
  runCommand('npm install', 'Installing dependencies');

  // Step 2: Generate Prisma client
  runCommand('npm run db:generate', 'Generating Prisma client');

  // Step 3: Run database migrations
  runCommand('npm run db:migrate', 'Running database migrations');

  // Step 4: Seed the database
  console.log('\n🔄 Seeding database with initial data...');
  runCommand('npx ts-node src/scripts/initializePermissions.ts', 'Initializing permissions and roles');
  runCommand('npx ts-node src/scripts/createSuperAdmin.ts', 'Creating super admin user');

  console.log('\n🎉 Database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Update the super admin credentials in the database');
  console.log('2. Start the backend server: npm run dev');
  console.log('3. Open Prisma Studio to view your database: npm run db:studio');
  console.log('\n🔐 Default Super Admin Credentials:');
  console.log('   Email: admin@nexafund.com');
  console.log('   Password: admin123');
  console.log('   ⚠️  Please change these credentials after first login!');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
