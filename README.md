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
copy .env.example .env
# Edit .env with backend URL, contract address, and VTN config
npm install
npm run dev
```
✅ Frontend: http://localhost:8080

### 4. Login
**Test Accounts:** See [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)
- Email: `superadmin@nexafund.com`
- Password: `Test@123`

### 5. MetaMask Wallet (Required for contributions)
**Wallet Setup:** See [docs/Wallet-Setup.md](docs/Wallet-Setup.md)
- Install MetaMask extension
- Add Tenderly VTN network (Chain ID: 73571)
- Request test POL from Tenderly faucet
- Connect wallet on campaign pages

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

### Smart Contracts (Deployed & Integrated)
- **Escrow System:** Contributions held in contract, not direct transfer
- **Milestone-Based Release:** Funds released after milestone approval
- **Weighted Voting:** Vote power based on contribution amount (60% approval, 10% quorum)
- **Network:** Tenderly VTN (Chain ID: 73571, POL currency)
- **Contract Address:** `0xaB37c74fD8598CF891990Ad69E84D94014AE8Aa9`

---

## 🛠️ Tech Stack

**Backend:** Express.js, TypeScript, Prisma, PostgreSQL (Neon Cloud)  
**Frontend:** React 18, TypeScript, Tailwind CSS, Vite, shadcn/ui, ethers.js v5  
**Blockchain:** Solidity 0.8.24, Hardhat, ethers.js v6, Tenderly VTN (Chain ID: 73571)  
**Security:** JWT, RBAC (6 roles, 32+ permissions), Helmet, CORS, Rate Limiting

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
cd smart-contracts
npx hardhat compile      # Compile contracts
npx hardhat test         # Run contract tests
npx hardhat run scripts/deploy-realistic-campaign.ts --network tenderlyVTN  # Deploy
```

---

## 🎯 Core Achievements

✅ **Enterprise RBAC** - 6 roles, 32+ permissions, resource ownership  
✅ **Full-Stack MVP** - Backend API, React frontend, PostgreSQL  
✅ **Smart Contracts Integrated** - Deployed to Tenderly VTN, escrow-based contributions  
✅ **Web3 Integration** - MetaMask connection, network auto-switching, POL transactions  
✅ **Security** - JWT auth, input validation, campaign status checks, error decoding  
✅ **Cloud-Ready** - Neon database, Tenderly VTN, no local blockchain required  
✅ **Test Suite** - 20+ tests covering core functionality  
✅ **Production Practices** - Error handling, user-friendly messages, pre-checks  

---

## 📚 Documentation

### Core Guides
- **[SETUP.md](SETUP.md)** - Complete setup guide with troubleshooting
- **[docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)** - Test credentials and scenarios
- **[docs/Wallet-Setup.md](docs/Wallet-Setup.md)** - MetaMask & Tenderly VTN setup

### Smart Contract Docs
- **[smart-contracts/README.md](smart-contracts/README.md)** - Contract overview & deployment
- **[DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)** - Initial deployment details
- **[DEPLOY_REALISTIC_CONTRACT.md](DEPLOY_REALISTIC_CONTRACT.md)** - Production deployment guide
- **[BUGFIX_CONTRIBUTION_HANG.md](BUGFIX_CONTRIBUTION_HANG.md)** - Recent bug fixes & solutions
- **[QUICK_FIX_TEST.md](QUICK_FIX_TEST.md)** - Testing & verification commands

### Additional Resources
- **[docs/](docs/)** - Project proposal and additional documentation

---

## 🔄 Development Status

### ✅ Completed (Phase 1 & 2)
- Enterprise role-based access control (6 roles, 32+ permissions)
- Campaign CRUD with reward tiers and milestones
- Admin dashboard and user management
- Smart contracts deployed to Tenderly VTN
- **Web3 Integration:** MetaMask wallet connection
- **Escrow System:** Contributions to contract (not direct transfer)
- **Network Auto-Switch:** Frontend switches to VTN automatically
- Profile pages and activity tracking
- File upload system
- Cloud database integration (Neon PostgreSQL)
- Error handling with decoded Solidity revert reasons

### 🚧 In Progress (Phase 3)
- Milestone voting UI for backers
- Admin contract management dashboard
- Per-campaign contract deployment (currently shared contract)

### 📋 Planned (Phase 4+)
- IPFS storage for campaign media and milestone evidence
- AI-powered fraud detection
- Real-time notifications (WebSocket)
- Production deployment (AWS/Vercel/Railway)
- Mainnet deployment with audited contracts

---

## 📊 Project Metrics

- **30+ API Endpoints** - Authentication, campaigns, users, contributions, milestones
- **12 Test Accounts** - All roles represented for testing (SUPER_ADMIN → USER)
- **8 Database Models** - Users, campaigns, contributions, milestones, reward tiers, reports, updates, votes
- **2 Production Contracts** - NexaFundWeighted (deployed), MilestoneEscrow (alternative)
- **100% Core Coverage** - Authentication, authorization, and contribution flow tested
- **1 Deployed Contract** - `0xaB37c74fD8598CF891990Ad69E84D94014AE8Aa9` on Tenderly VTN

---

## 📝 Academic Context

**Project Type:** Final Year Project (FYP)  
**Focus:** Blockchain + Enterprise Web Development  
**Purpose:** Demonstrating production-ready practices with decentralized technology  

---

## 🤝 Need Help?

### Common Issues

**"Contribution exceeds campaign goal"**
- Current contract has 10 POL goal (test deployment)
- Solution: Contribute ≤$5, or deploy realistic contract (see [DEPLOY_REALISTIC_CONTRACT.md](DEPLOY_REALISTIC_CONTRACT.md))

**"Unsupported Network"**
- MetaMask not on Tenderly VTN (Chain ID: 73571)
- Solution: Frontend auto-switches on connect, or add manually (see [docs/Wallet-Setup.md](docs/Wallet-Setup.md))

**"User not found" errors**
- Campaign creator ID doesn't match database user
- Solution: Non-critical, fallback user returned automatically

**Backend won't start**
- Check DATABASE_URL in `.env`
- Run `npm run db:setup` to initialize

**Frontend can't connect**
- Check VITE_API_URL points to `http://localhost:5050/api`
- Verify backend is running on port 5050

### Documentation Resources
- **Setup Issues:** Check [SETUP.md](SETUP.md) troubleshooting section
- **Test Accounts:** See [docs/TEST_ACCOUNTS.md](docs/TEST_ACCOUNTS.md)
- **Environment:** Check `.env.example` files in backend/frontend/smart-contracts folders
- **Contract Issues:** See [BUGFIX_CONTRIBUTION_HANG.md](BUGFIX_CONTRIBUTION_HANG.md)

---

**Built with enterprise standards for decentralized crowdfunding** 🚀
