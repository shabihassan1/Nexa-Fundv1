# 🎯 Quick Start - What To Do Next

## ✅ COMPLETED
- [x] Added `contractAddress` field to Campaign model
- [x] Database migration successful
- [x] Smart contracts compiled
- [x] Deployment scripts created

---

## 🚀 YOUR ACTION ITEMS (In Order)

### 1️⃣ **Set Up Tenderly VTN** (5 minutes)
```
1. Go to https://tenderly.co/ → Sign up (free)
2. Create Project
3. Click "DevNets" → "Create DevNet"
4. Choose:
   - Base Chain: Polygon
   - Chain ID: 10123 (or any number you like)
   - Currency: POL
5. Copy the RPC URL they give you
```

**You'll get:**
- RPC URL: `https://virtual.polygon.rpc.tenderly.co/xxxxx`
- Chain ID: Your custom ID
- Admin wallet with free test POL

---

### 2️⃣ **Update Config Files** (2 minutes)

#### File 1: `smart-contracts/.env`
```env
TENDERLY_RPC_URL=https://virtual.polygon.rpc.tenderly.co/YOUR_ID_HERE
TENDERLY_CHAIN_ID=10123
PRIVATE_KEY=your_tenderly_admin_wallet_private_key
```

#### File 2: `smart-contracts/hardhat.config.ts`
Add this to the `networks:` section:
```typescript
tenderlyVTN: {
  url: process.env.TENDERLY_RPC_URL || "",
  accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  chainId: 10123  // Your chain ID
}
```

#### File 3: `frontend/.env`
```env
VITE_API_URL=http://127.0.0.1:5050/api
VITE_RPC_URL=https://virtual.polygon.rpc.tenderly.co/YOUR_ID_HERE
VITE_CHAIN_ID_DEC=10123
VITE_CHAIN_ID_HEX=0x2793
VITE_NATIVE_SYMBOL=POL
VITE_NETWORK_NAME=NexaFund VTN
```

---

### 3️⃣ **Deploy First Contract** (1 minute)
```powershell
cd "c:\Users\shabi\Desktop\NexaFund v1\Nexa-Fundv1\smart-contracts"
npx hardhat run scripts/deploy-nexafund-weighted.ts --network tenderlyVTN
```

**Copy the contract address from the output!**

---

### 4️⃣ **Tell Me Your Results**

Come back and share:
- ✅ Contract address (0x...)
- ✅ Your chain ID
- ❌ Any errors you got

Then I'll help you with **Phase 2: Wire Frontend to Contract**

---

## 🆘 Quick Help

**Problem:** "Cannot find network tenderlyVTN"
- Check you edited `hardhat.config.ts` correctly
- Make sure `.env` file exists with `TENDERLY_RPC_URL`

**Problem:** "Insufficient funds"
- Your Tenderly admin wallet should be pre-funded
- Check you copied the correct private key

**Problem:** "Invalid RPC URL"
- Copy the FULL URL from Tenderly (including `/xxxxx` at the end)

---

## 📚 Reference Files Created

- `PHASE1_PROGRESS.md` - Detailed guide
- `QUICK_START.md` - This file
- `smart-contracts/scripts/deploy-nexafund-weighted.ts` - Main deployment script
- `smart-contracts/scripts/deploy-local-test.ts` - Local testing

---

**Ready? Go set up Tenderly, then come back! 🚀**
