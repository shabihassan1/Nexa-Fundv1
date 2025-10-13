# 🚀 Deploy Contract with Realistic Goal

## The Problem
Current contract: **10 POL goal** (too small!)
Your campaign: Probably **$10,000+ goal** (20,000+ POL)

## Solution: Deploy New Contract

### Step 1: Edit Campaign Parameters

Open `smart-contracts/scripts/deploy-realistic-campaign.ts` and customize:

```typescript
const CAMPAIGN_GOAL_USD = 10000;  // 👈 Change to your campaign's USD goal
const POL_PRICE_USD = 0.50;       // 👈 Keep synced with frontend conversion rate
```

**Example goals:**
- Small campaign: `CAMPAIGN_GOAL_USD = 1000` (→ 2,000 POL)
- Medium campaign: `CAMPAIGN_GOAL_USD = 10000` (→ 20,000 POL)
- Large campaign: `CAMPAIGN_GOAL_USD = 50000` (→ 100,000 POL)

### Step 2: Deploy to Tenderly VTN

```powershell
cd smart-contracts
npx hardhat run scripts/deploy-realistic-campaign.ts --network tenderlyVTN
```

**Expected output:**
```
✅ Contract deployed successfully!
📍 Contract address: 0x...

✅ NEXT STEPS:
1️⃣  Update your campaign in the database
2️⃣  Update frontend .env file
3️⃣  Restart the frontend
```

### Step 3: Update Database

Copy the SQL command from the output:

```sql
UPDATE campaigns 
SET "contractAddress" = '0xNEW_CONTRACT_ADDRESS_HERE' 
WHERE id = 'cmgmu1hra001arda415xwfg86';  -- Your campaign ID
```

Run it in your database client (e.g., Neon Cloud dashboard).

### Step 4: Update Frontend Environment

Edit `frontend/.env`:

```bash
# OLD
VITE_CONTRACT_ADDRESS=0xaB37c74fD8598CF891990Ad69E84D94014AE8Aa9

# NEW
VITE_CONTRACT_ADDRESS=0xNEW_CONTRACT_ADDRESS_HERE
```

### Step 5: Restart Frontend

```powershell
cd frontend
npm run dev
```

### Step 6: Test Contribution

1. Refresh browser at `localhost:8080`
2. Go to your campaign
3. Click "Back this Project"
4. Enter **$250** (or any amount)
5. Should work now! ✅

---

## 📊 Verification Commands

After deployment, verify in browser console:

```javascript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const contractAddr = "0xNEW_CONTRACT_ADDRESS_HERE";
const abi = [
  "function goal() view returns (uint256)",
  "function raised() view returns (uint256)",
  "function creator() view returns (address)"
];
const contract = new ethers.Contract(contractAddr, abi, provider);

// Check configuration
const goal = await contract.goal();
const creator = await contract.creator();
console.log("Goal:", ethers.utils.formatEther(goal), "POL");
console.log("Creator:", creator);
```

**Expected:**
- Goal: `20000 POL` (for $10k campaign)
- Creator: Your wallet address

---

## 🎯 Success Criteria

After deployment, you should be able to:

✅ Contribute amounts up to the campaign goal
✅ See realistic goal displayed (e.g., 20,000 POL)
✅ Multiple users can contribute
✅ Total contributions tracked on-chain

---

## ⚠️ Important Notes

1. **POL Price Sync**: The conversion rate in the script (0.50) **must match** the rate in `frontend/src/utils/walletConnector.ts` line 200

2. **Per-Campaign Contracts**: In production, each campaign should have its own contract. For now, we're deploying one contract for testing.

3. **Creator Address**: Line 27 in the script uses `deployer.address` - change this to the actual campaign creator's wallet address if different.

4. **Milestone Split**: Default is 30%-40%-30%. Customize `MILESTONE_DESCRIPTIONS` and percentages as needed.

---

## 🔄 Alternative: Quick Test with Small Amount

**If you don't want to redeploy yet:**

Just test with **$5 contribution** on the existing contract:
- $5 → 10 POL
- Fits in current 10 POL goal
- Proves the flow works ✅

Then deploy new contract later for realistic testing.
