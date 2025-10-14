# 🚀 Phase 1 Complete - Smart Contract Integration Setup

## ✅ What We Just Did

### 1. **Database Schema Update**
- ✅ Added `contractAddress` field to Campaign model
- ✅ Migration created: `20251012223131_add_contract_address_to_campaign`
- ✅ Database updated successfully

```prisma
model Campaign {
  contractAddress String? // NEW: Smart contract address for on-chain escrow
  // ... rest of fields
}
```

### 2. **Smart Contracts Compiled**
- ✅ NexaFundWeighted.sol compiled
- ✅ MilestoneEscrow.sol compiled
- ✅ TypeChain types generated for TypeScript

### 3. **Deployment Scripts Created**
- ✅ `scripts/deploy-nexafund-weighted.ts` - Production deployment
- ✅ `scripts/deploy-local-test.ts` - Local testing
- ✅ Both scripts use ethers v6 syntax (compatible with Hardhat)

---

## 📋 Next Steps - What YOU Need to Do

### **Step 1: Set Up Tenderly Virtual TestNet (VTN)**

You need to create your own Polygon-based test network on Tenderly.

#### A. Create Tenderly Account (if you haven't)
1. Go to https://tenderly.co/
2. Sign up with GitHub/Google (free)
3. Create a new project

#### B. Create Virtual TestNet
1. In Tenderly Dashboard → Click **"DevNets"**
2. Click **"Create DevNet"**
3. Configure:
   - **Name**: "NexaFund VTN"
   - **Base Chain**: Polygon
   - **Chain ID**: Choose a custom ID (e.g., `10123`)
   - **Network Name**: "NexaFund VTN"
   - **Currency Symbol**: `POL`
4. Click **Create**

#### C. Get Network Details
After creation, Tenderly will give you:
- ✅ **RPC URL**: `https://virtual.polygon.rpc.tenderly.co/YOUR_PROJECT_ID`
- ✅ **Chain ID**: Your custom chain ID (e.g., `10123`)
- ✅ **Admin Wallet**: Pre-funded with test POL

**Save these details - you'll need them next!**

---

### **Step 2: Configure Hardhat for Tenderly VTN**

Open `smart-contracts/hardhat.config.ts` and add your Tenderly network:

```typescript
// hardhat.config.ts
networks: {
  hardhat: {},
  polygonAmoy: {
    url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 80002
  },
  // ADD THIS:
  tenderlyVTN: {
    url: process.env.TENDERLY_RPC_URL || "YOUR_RPC_URL_HERE",
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    chainId: 10123  // Your custom chain ID
  }
}
```

---

### **Step 3: Configure Environment Variables**

#### A. Smart Contracts (for deployment)

Create/update `smart-contracts/.env`:

```env
# Tenderly Virtual TestNet
TENDERLY_RPC_URL=https://virtual.polygon.rpc.tenderly.co/YOUR_PROJECT_ID
TENDERLY_CHAIN_ID=10123

# Deployer Private Key (get from Tenderly admin wallet)
PRIVATE_KEY=your_private_key_here
```

**⚠️ IMPORTANT**: 
- The `PRIVATE_KEY` should be from the Tenderly admin wallet (or any wallet you fund)
- This wallet will be the "admin" of deployed contracts
- Never commit this file to git (already in .gitignore)

#### B. Frontend (for connecting)

Update `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5050/api

# ADD THESE:
VITE_RPC_URL=https://virtual.polygon.rpc.tenderly.co/YOUR_PROJECT_ID
VITE_CHAIN_ID_DEC=10123
VITE_CHAIN_ID_HEX=0x2793
VITE_NATIVE_SYMBOL=POL
VITE_NETWORK_NAME=NexaFund VTN
```

**How to calculate hex chain ID:**
```javascript
// In browser console or Node:
(10123).toString(16) // Result: "2793"
// So VITE_CHAIN_ID_HEX=0x2793
```

---

### **Step 4: Deploy Your First Contract (TEST)**

Once you've configured everything:

```powershell
# Navigate to smart-contracts
cd "c:\Users\shabi\Desktop\NexaFund v1\Nexa-Fundv1\smart-contracts"

# Deploy to Tenderly VTN
npx hardhat run scripts/deploy-nexafund-weighted.ts --network tenderlyVTN
```

**Expected Output:**
```
🚀 Starting NexaFundWeighted deployment...

📝 Deploying with account: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
💰 Account balance: 100.0 POL

📋 Deployment Parameters:
   Creator: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   Goal: 10 POL
   Milestones: 3
   Min Quorum: 1.0 POL

⏳ Deploying NexaFundWeighted contract...
✅ Contract deployed!
📍 Contract address: 0xABCDEF1234567890...

📝 NEXT STEPS:
1. Save contract address to your backend database:
   Campaign.contractAddress = "0xABCDEF1234567890..."
```

**📝 Copy the contract address** - you'll use it in the next steps!

---

### **Step 5: Test Locally First (RECOMMENDED)**

Before deploying to Tenderly, test locally:

```powershell
# Terminal 1: Start local Hardhat node
cd "c:\Users\shabi\Desktop\NexaFund v1\Nexa-Fundv1\smart-contracts"
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy-local-test.ts --network localhost
```

This will:
- ✅ Start a local blockchain
- ✅ Deploy contract
- ✅ Test a contribution
- ✅ Verify everything works

---

## 🎯 Summary - What's Ready vs What's Next

### ✅ **READY NOW:**
- Database schema with `contractAddress` field
- Smart contracts compiled and ready to deploy
- Deployment scripts created and tested
- Local testing capability

### 🔄 **NEXT (After You Set Up Tenderly):**
- Deploy contract to Tenderly VTN
- Get contract address
- Update backend to store contract addresses when creating campaigns
- Update frontend to call contract functions instead of direct transfers

---

## 🆘 Troubleshooting

### "Cannot find network tenderlyVTN"
- ✅ Make sure you edited `hardhat.config.ts` with your network
- ✅ Check `TENDERLY_RPC_URL` is set in `.env`

### "Insufficient funds"
- ✅ Your deployer wallet needs test POL
- ✅ Tenderly admin wallet should have pre-funded balance
- ✅ Check balance: `await ethers.provider.getBalance(address)`

### "Contract deployment failed"
- ✅ Check RPC URL is correct
- ✅ Verify chain ID matches
- ✅ Ensure private key is valid

---

## 📞 When You're Ready

Once you:
1. ✅ Create Tenderly VTN
2. ✅ Configure `.env` files
3. ✅ Deploy a test contract

**Come back and tell me:**
- The contract address you deployed
- Your Tenderly chain ID
- Any errors you encountered

Then we'll move to **Phase 1, Step 3**: Wiring the frontend to call contract functions! 🚀

---

## 🔗 Useful Commands

```powershell
# Compile contracts
cd smart-contracts; npx hardhat compile

# Deploy to Tenderly VTN
npx hardhat run scripts/deploy-nexafund-weighted.ts --network tenderlyVTN

# Local test deployment
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy-local-test.ts --network localhost  # Terminal 2

# Check Hardhat config
npx hardhat config

# Clean and recompile
npx hardhat clean; npx hardhat compile
```

---

**Current Status:** ✅ Phase 1 Step 1-2 Complete
**Next:** You configure Tenderly, then we continue! 💪
