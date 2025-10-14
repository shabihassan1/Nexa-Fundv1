# 🚀 PHASE 2: Frontend Web3 Integration

**Status:** In Progress  
**Date Started:** October 12, 2025

---

## ✅ **What We Just Created**

### 1. **Network Configuration Helper** (`frontend/src/lib/web3.ts`)
Provides utilities for:
- ✅ Auto-add Tenderly VTN to MetaMask
- ✅ Auto-switch to correct network
- ✅ Check current network
- ✅ Format currency with POL symbol
- ✅ Get contract address from environment

**Key Functions:**
```typescript
addTenderlyVTNNetwork()    // Add network to MetaMask
switchToTenderlyVTN()      // Switch to VTN
ensureTenderlyVTN()        // Auto-switch if needed
getNativeCurrencySymbol()  // Returns "POL"
formatCurrency(amount)     // Formats with POL symbol
```

### 2. **Contract Interaction Helper** (`frontend/src/lib/contractInteraction.ts`)
Provides easy contract calls:
- ✅ `contributeToContract()` - Send POL to escrow
- ✅ `getCampaignState()` - Read contract state
- ✅ `getUserContribution()` - Check user's contribution
- ✅ `getMilestone()` - Get milestone details
- ✅ `voteOnMilestone()` - Vote on milestone
- ✅ `hasUserVoted()` - Check if user voted

---

## 🎯 **Next Steps: Update Frontend Components**

### **Step 1: Update WalletContext to Auto-Switch Network**

We need to modify `frontend/src/contexts/WalletContext.tsx` to:
1. Auto-switch to Tenderly VTN when connecting
2. Use the new helper functions

### **Step 2: Replace Direct Transfer with Contract Call**

Update `walletConnector.ts` function:
- OLD: `contributeToChain()` → Direct wallet-to-wallet transfer
- NEW: `contributeToContract()` → Call smart contract

### **Step 3: Replace "ETH" with "POL" Everywhere**

Files to update:
- `components/BackingModal.tsx`
- `pages/CampaignDetails.tsx`
- Any component showing currency

Change:
```typescript
// OLD
<span>{amount} ETH</span>

// NEW
import { getNativeCurrencySymbol } from "@/lib/web3";
<span>{amount} {getNativeCurrencySymbol()}</span>
```

### **Step 4: Update Campaign Creation Flow**

When a campaign is created that requires milestones:
1. Deploy a new contract instance
2. Save `contractAddress` to database
3. Store in Campaign record

---

## 📋 **Manual Changes Needed**

### **1. Update WalletContext.tsx**

Add network switching to the `connect()` function:

```typescript
import { ensureTenderlyVTN } from "@/lib/web3";

const handleConnect = async (showToast = true) => {
  try {
    setIsLoading(true);
    
    // Connect wallet
    const walletState = await connectWallet();
    
    // NEW: Ensure on correct network
    await ensureTenderlyVTN();
    
    setWallet(walletState);
    // ... rest of code
  } catch (error) {
    // ... error handling
  }
};
```

### **2. Update walletConnector.ts**

Replace the `contributeToChain` function:

```typescript
// BEFORE (Line ~176)
export const contributeToChain = async (
  provider: ethers.providers.Web3Provider,
  campaignId: string,
  amountInUSD: number,
  recipientAddress: string
): Promise<{ txHash: string; amountInETH: string }> => {
  // ... direct transfer code
}

// AFTER
import { contributeToContract } from "@/lib/contractInteraction";
import { ensureTenderlyVTN } from "@/lib/web3";

export const contributeToChain = async (
  provider: ethers.providers.Web3Provider,
  campaignId: string,
  amountInUSD: number,
  recipientAddress: string  // This becomes unused - we send to contract
): Promise<{ txHash: string; amountInETH: string }> => {
  try {
    // Ensure on correct network
    await ensureTenderlyVTN();
    
    // Convert USD to POL (simplified - you'd use real price oracle)
    const polPriceInUSD = 0.50; // Example: 1 POL = $0.50
    const amountInPOL = amountInUSD / polPriceInUSD;
    
    // Call contract instead of direct transfer
    return await contributeToContract(provider, amountInPOL);
  } catch (error: any) {
    console.error("Error contributing:", error);
    throw error;
  }
}
```

### **3. Update BackingModal.tsx**

Replace currency symbol:

```typescript
import { getNativeCurrencySymbol } from "@/lib/web3";

// Find all instances of "ETH" and replace with:
const currencySymbol = getNativeCurrencySymbol();

// Example:
<span>Amount: {amount} {currencySymbol}</span>
```

### **4. Update CampaignDetails.tsx**

Same as above - replace "ETH" with dynamic symbol.

---

## 🧪 **Testing Checklist**

After making the changes:

### **Test 1: Network Auto-Switch**
1. ✅ Connect MetaMask on wrong network
2. ✅ Should prompt to switch to Tenderly VTN
3. ✅ Should add network if not present

### **Test 2: Contribution Flow**
1. ✅ Click "Back This Project"
2. ✅ Should switch to Tenderly VTN
3. ✅ Should call contract (not direct transfer)
4. ✅ Verify funds locked in contract address
5. ✅ Check contract.raised() increased
6. ✅ Creator wallet balance unchanged (funds in escrow!)

### **Test 3: Currency Display**
1. ✅ All amounts show "POL" not "ETH"
2. ✅ Price conversions use POL

### **Test 4: Campaign State**
1. ✅ Can read goal/raised from contract
2. ✅ Can check user's contribution
3. ✅ Milestone data displays correctly

---

## 🔧 **Quick Implementation**

Want me to make these changes for you? Just say:

**"Update WalletContext"** - I'll modify the wallet connection
**"Update contributeToChain"** - I'll replace direct transfer with contract call
**"Replace ETH with POL"** - I'll update all currency displays
**"Do it all"** - I'll make all changes at once

---

## 📊 **Progress Tracking**

- [x] Phase 1: Database & Contract Deployment
  - [x] Add contractAddress field
  - [x] Deploy to Tenderly VTN
  - [x] Configure environment
- [ ] Phase 2: Frontend Integration (IN PROGRESS)
  - [x] Create web3 helpers
  - [x] Create contract interaction helpers
  - [ ] Update WalletContext
  - [ ] Update contributeToChain
  - [ ] Replace ETH with POL
  - [ ] Test contribution flow
- [ ] Phase 3: Milestone Voting UI
- [ ] Phase 4: Admin Dashboard Integration
- [ ] Phase 5: End-to-End Testing

---

## 🆘 **Need Help?**

If you encounter:
- **"Wrong network" errors** → Check VITE_CHAIN_ID_HEX is correct
- **"Cannot read contract"** → Verify VITE_CONTRACT_ADDRESS is set
- **MetaMask doesn't switch** → User may need to approve manually
- **Funds go to creator directly** → Make sure using new contributeToContract()

---

**Ready to continue?** Let me know which part you want to tackle first! 🚀
