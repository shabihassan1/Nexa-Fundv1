# Nexa Fund – Blockchain Crowdfunding Platform

Enterprise-level crowdfunding platform with role-based access control, smart contracts, and fraud prevention. Built as a Final Year Project (FYP).

## ⚠️ Testing Phase

**NO REAL MONEY** - All transactions are simulated for testing purposes only.

---

## 🚀 Quick Start

**Setup Time:** 5-10 minutes  
**Detailed Guide:** See [SETUP.md](SETUP.md)

### 1. Get Cloud Database (2 min)
- Sign up at [neon.tech](https://neon.tech) (free, no credit card)
- Create project and copy connection string

### 2. Backend (3 min)
```powershell
cd backend
copy .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npm run db:setup
npm run dev
```
✅ Backend: http://localhost:5050

### 3. Frontend (2 min)
```powershell
cd frontend
echo VITE_API_URL=http://localhost:5050/api > .env
npm install
npm run dev
```
✅ Frontend: http://localhost:8080

### 4. Login
**Test Accounts:** See [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)
- Email: `superadmin@nexafund.com`
- Password: `Test@123`

### 5. MetaMask Wallet (Optional - for blockchain features)
**Wallet Setup:** See [docs/Wallet-Setup.md](docs/Wallet-Setup.md)
- Add NexaFund VTN network to MetaMask
- Fund test wallets with POL tokens

---

## ✨ Key Features

### Security & Roles
- **6-Tier Role System:** SUPER_ADMIN → ADMIN → MODERATOR → CREATOR → BACKER → USER
- **32+ Permissions** across campaign management, user moderation, analytics
- **Auto-Role Progression:** USER → BACKER → CREATOR based on activity
- **Campaign Status Security:** Only ACTIVE campaigns can be backed

### Platform Features
- **Campaign Management:** Create, edit, browse with reward tiers and milestones
- **Admin Dashboard:** User management, campaign oversight, platform analytics
- **Profile System:** User dashboards with activity tracking
- **Content Moderation:** Report handling and fraud prevention
- **File Management:** Image uploads with secure serving

### Smart Contracts (Ready)
- **Milestone-Based Funding:** Funds released after milestone approval
- **Community Voting:** Backers vote on milestone completion
- **Weighted Voting:** Vote power based on contribution amount
- **Admin Override:** Emergency fund release capability

---

## 🛠️ Tech Stack

**Backend:** Express.js, TypeScript, Prisma, PostgreSQL (Neon Cloud)  
**Frontend:** React, TypeScript, Tailwind CSS, Vite, shadcn/ui  
**Blockchain:** Solidity, Hardhat, ethers.js v6, Polygon Amoy  
**Security:** JWT, RBAC, Helmet, CORS, Rate Limiting

---

## 📁 Project Structure

```
Nexa-Fundv1/
├── backend/              # Express + TypeScript + Prisma
├── frontend/             # React + Vite + Tailwind
├── smart-contracts/      # Hardhat + Solidity
├── docs/                 # Documentation & test accounts
├── README.md             # This file
└── SETUP.md              # Detailed setup guide
```

---

## 🔧 Useful Commands

### Backend
```powershell
npm run dev              # Start server (port 5050)
npm run db:setup         # Complete database setup
npm run db:seed          # Seed test users
npm test                 # Run tests
```

### Frontend
```powershell
npm run dev              # Start dev server (port 8080)
npm run build            # Build for production
```

### Smart Contracts
```powershell
npx hardhat node         # Start local blockchain
npx hardhat test         # Run contract tests
```

---

## 🎯 Core Achievements

✅ **Enterprise RBAC** - 6 roles, 32+ permissions, resource ownership  
✅ **Full-Stack MVP** - Backend API, React frontend, PostgreSQL  
✅ **Smart Contracts** - Milestone-based funding with voting  
✅ **Security** - JWT auth, input validation, campaign status checks  
✅ **Cloud-Ready** - Neon database, no local setup required  
✅ **Test Suite** - 20+ tests covering core functionality  

---

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup guide with troubleshooting
- **[docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)** - Test credentials and scenarios
- **[docs/](docs/)** - Additional documentation and project proposal

---

## 🔄 Development Status

### ✅ Completed
- Enterprise role-based access control
- Campaign CRUD with reward tiers
- Admin dashboard and user management
- Smart contracts with milestone voting
- Profile pages and activity tracking
- File upload system
- Cloud database integration

### 🚧 Planned
- Web3 wallet integration (MetaMask)
- IPFS storage for campaign media
- AI-powered fraud detection
- Real-time notifications
- Production deployment (AWS/Vercel)

---

## 📊 Project Metrics

- **30+ API Endpoints** - Authentication, campaigns, users, contributions
- **12 Test Accounts** - All roles represented for testing
- **6 Database Models** - Users, campaigns, contributions, milestones, reports, permissions
- **3 Smart Contracts** - Basic, weighted voting, milestone-based
- **100% Core Coverage** - Authentication and authorization tests

---

## 📝 Academic Context

**Project Type:** Final Year Project (FYP)  
**Focus:** Blockchain + Enterprise Web Development  
**Purpose:** Demonstrating production-ready practices with decentralized technology  

---

## 🤝 Need Help?

- **Setup Issues:** Check [SETUP.md](SETUP.md) troubleshooting section
- **Test Accounts:** See [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)
- **Environment:** Check `.env.example` files in backend/frontend folders

---

**Built with enterprise standards for decentralized crowdfunding** 🚀
