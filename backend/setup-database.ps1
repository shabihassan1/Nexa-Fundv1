# Database Setup Script for NexaFund (PowerShell)
# 
# This script will:
# 1. Check if .env file exists
# 2. Install dependencies
# 3. Generate Prisma client
# 4. Run database migrations
# 5. Seed the database with initial data

Write-Host "🚀 Starting NexaFund Database Setup..." -ForegroundColor Green
Write-Host ""

# Check if .env file exists
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "📝 Please create a .env file with the following content:" -ForegroundColor Yellow
    Write-Host @"

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
"@ -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Replace username, password, and nexafund_db with your actual PostgreSQL credentials!" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Function to run commands with error handling
function Invoke-CommandWithErrorHandling {
    param(
        [string]$Command,
        [string]$Description
    )
    
    try {
        Write-Host ""
        Write-Host "🔄 $Description..." -ForegroundColor Blue
        Invoke-Expression $Command
        Write-Host "✅ $Description completed" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Error during $Description`: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

try {
    # Step 1: Install dependencies
    Invoke-CommandWithErrorHandling "npm install" "Installing dependencies"

    # Step 2: Generate Prisma client
    Invoke-CommandWithErrorHandling "npm run db:generate" "Generating Prisma client"

    # Step 3: Run database migrations
    Invoke-CommandWithErrorHandling "npm run db:migrate" "Running database migrations"

    # Step 4: Seed the database
    Write-Host ""
    Write-Host "🔄 Seeding database with initial data..." -ForegroundColor Blue
    Invoke-CommandWithErrorHandling "npx ts-node src/scripts/initializePermissions.ts" "Initializing permissions and roles"
    Invoke-CommandWithErrorHandling "npx ts-node src/scripts/createSuperAdmin.ts" "Creating super admin user"

    Write-Host ""
    Write-Host "🎉 Database setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update the super admin credentials in the database"
    Write-Host "2. Start the backend server: npm run dev"
    Write-Host "3. Open Prisma Studio to view your database: npm run db:studio"
    Write-Host ""
    Write-Host "🔐 Default Super Admin Credentials:" -ForegroundColor Cyan
    Write-Host "   Email: admin@nexafund.com"
    Write-Host "   Password: admin123"
    Write-Host "   ⚠️  Please change these credentials after first login!" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
