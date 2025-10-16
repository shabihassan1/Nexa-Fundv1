# 🚀 Nexa Fund - Setup Guide

**Last Updated:** October 12, 2025  
**Setup Time:** 5-10 minutes

---

## ⚠️ Testing Phase Notice

**This is a TESTING/DEVELOPMENT environment:**
- ❌ NO REAL MONEY involved
- ✅ All transactions are SIMULATED
- ✅ Educational purposes only

---

## 📋 Quick Setup

### Choose Your Database Setup:

#### **Option A: Local PostgreSQL (Recommended for Demo/Testing)** ⚡
**Pros:** Lightning fast, no internet required, perfect for demos  
**Cons:** Only accessible on this machine

#### **Option B: Neon Cloud PostgreSQL** ☁️
**Pros:** Access from any device, free hosting, no maintenance  
**Cons:** Slower queries, requires internet connection

---

## 🗄️ Database Setup

### Option A: Local PostgreSQL (Fast Demo Setup)

**1. Install PostgreSQL**
- Download from [postgresql.org/download](https://www.postgresql.org/download/)
- Install with default settings
- Remember your username/password and port

**2. Create Database**
```powershell
# Using psql command line (or pgAdmin GUI)
createdb -U postgres -p 5433 nexafund
```

**3. Configure Backend**
```powershell
cd backend
copy .env.example .env
# Edit .env - set DATABASE_URL to local:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:YOUR_PORT/nexafund"
```

**4. Migrate Data from Neon (Optional)**
```powershell
# Export from Neon
pg_dump "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" > neon_backup.sql

# Import to Local
psql -U postgres -p 5433 -d nexafund < neon_backup.sql
```

**5. Setup Database**
```powershell
npm install
npm run db:setup
npm run dev
```

✅ Backend running on http://localhost:5050

---

### Option B: Neon Cloud PostgreSQL

**1. Get Cloud Database (2 minutes)**
1. Visit [neon.tech](https://neon.tech)
2. Sign up with GitHub/Google (free, no credit card)
3. Create new project → Copy connection string
4. Format: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

**2. Backend Setup (3 minutes)

```powershell
cd backend
copy .env.example .env
# Edit .env - paste your DATABASE_URL and generate JWT_SECRET
npm install
npm run db:setup
npm run dev
```

✅ Backend running on http://localhost:5050

### Step 3: Frontend Setup (2 minutes)

```powershell
cd frontend
echo VITE_API_URL=http://localhost:5050/api > .env
npm install
npm run dev
```

✅ Frontend running on http://localhost:8080

### Step 4: MetaMask & Wallet Setup (5 minutes)

See **[docs/Wallet-Setup.md](docs/Wallet-Setup.md)** for:
- Adding NexaFund VTN network to MetaMask
- Getting test POL tokens
- Funding test wallets

---

## 🔑 Test Accounts

All accounts use password: **`Test@123`**

| Role | Email | Purpose |
|------|-------|---------|
| **SUPER_ADMIN** | superadmin@nexafund.com | Full platform access |
| **ADMIN** | admin@nexafund.com | Platform administration |
| **MODERATOR** | moderator@nexafund.com | Content moderation |
| **CREATOR** | creator1@nexafund.com | Campaign creator #1 |
| **CREATOR** | creator2@nexafund.com | Campaign creator #2 |
| **CREATOR** | creator3@nexafund.com | Campaign creator #3 |
| **BACKER** | backer1@nexafund.com | Campaign supporter #1 |
| **BACKER** | backer2@nexafund.com | Campaign supporter #2 |
| **BACKER** | backer3@nexafund.com | Campaign supporter #3 |
| **USER** | user1@nexafund.com | Regular user #1 |
| **USER** | user2@nexafund.com | Regular user #2 |
| **USER** | user3@nexafund.com | Regular user #3 |

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database - Choose ONE option below:

# Option A: Local PostgreSQL (Fast)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:YOUR_PORT/nexafund"

# Option B: Neon Cloud (Remote)
# DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

# JWT Secret (Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-64-character-random-string-here

# Server
PORT=5050
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5050/api
```

---

## ✅ Verify Setup

1. **Health Check:** http://localhost:5050/health
2. **Frontend:** http://localhost:8080
3. **Login:** Use any test account above

---

## 🐛 Troubleshooting

### Backend won't start
```powershell
cd backend
npm run db:generate
npm run dev
```

### Database connection failed
- **Local PostgreSQL:** Check username, password, and port match your installation
- **Neon Cloud:** Ensure SSL is included: `?sslmode=require`
- Verify PostgreSQL service is running (for local)

### Frontend can't connect
- Verify backend is running on port 5050
- Check frontend `.env` has correct API URL

### Login fails
- Use exact email addresses from test accounts table
- Password: `Test@123` (case-sensitive)

---

## 📦 Useful Commands

### Backend
```powershell
npm run dev              # Start development server
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed test users
npm run db:setup         # Complete database setup
npm run db:studio        # Open Prisma Studio
```

### Frontend
```powershell
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## 🎯 Project Structure

```
Nexa-Fundv1/
├── backend/              # Express + TypeScript + Prisma
│   ├── src/
│   ├── prisma/
│   └── uploads/
├── frontend/             # React + Vite + Tailwind
│   ├── src/
│   └── public/
├── smart-contracts/      # Hardhat + Solidity
└── docs/                 # Documentation
```

---

## 📞 Need Help?

- **Setup Issues:** Check troubleshooting section above
- **Test Accounts:** See test accounts table
- **Environment Setup:** Check `.env.example` files

---

**Ready to start developing!** 🎉
