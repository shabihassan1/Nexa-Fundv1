# NexaFundWeightedV2 - Contract Summary

## 🎯 Core Concept: TRUE ESCROW BEHAVIOR

The V2 contract implements proper escrow logic where funds automatically move based on voting results WITHOUT requiring manual intervention.

---

## 🔑 Private Key Usage

| Action | Who Signs Transaction | Private Key Needed? |
|--------|----------------------|---------------------|
| **Contribute** | Backer | ✅ YES - Backer's private key |
| **Vote on Milestone** | Backer | ✅ YES - Backer's private key |
| **Receive Milestone Funds** | Creator | ❌ NO - Auto-sent by contract |
| **Claim Refund** | Backer | ✅ YES - Backer's private key |
| **Admin Force Release** | Admin | ✅ YES - Admin's private key |
| **Admin Reject Milestone** | Admin | ✅ YES - Admin's private key |

---

## 📊 Milestone States

```
┌─────────────┐
│  Created    │ Initial state
└──────┬──────┘
       │
       ├─ Voting Opened
       │
       ├─ Backers Vote
       │
       ▼
┌─────────────────────┐
│  Quorum + Threshold │
└──────┬──────────────┘
       │
       ├──── ≥60% YES ──────► released = true ──► Funds sent to creator ✅
       │
       └──── <60% YES ──────► rejected = true ──► Backers claim refunds 🔄
```

---

## 🔄 Flow Diagrams

### Happy Path - Milestone Approved
```
1. Backer contributes 10 POL
   └─► Signs with their private key
   └─► Funds locked in contract

2. Admin opens voting for Milestone 1

3. Backers vote YES
   └─► Each signs with their private key

4. Voting passes (≥60% yes, quorum met)
   └─► Contract calls _releaseToCreator()
   └─► Funds automatically sent to creator.wallet
   └─► Creator sees 10 POL in their wallet
   └─► Creator DID NOTHING - received automatically ✅
```

### Rejection Path - Milestone Rejected
```
1. Backer contributes 10 POL
   └─► Signs with their private key
   └─► Funds locked in contract

2. Admin opens voting for Milestone 1

3. Backers vote NO
   └─► Each signs with their private key

4. Voting fails (<60% yes)
   └─► Contract marks milestone.rejected = true
   └─► Funds stay in contract

5. Backer calls claimRefund(0)
   └─► Signs with their private key
   └─► Gets proportional refund back
   └─► Backer sees 10 POL returned to wallet ✅
```

### Emergency Path - Admin Reconciliation
```
1. Milestone approved but auto-release failed
   └─► Network error, gas issue, etc.

2. Creator reports funds not received

3. Admin logs into reconciliation panel

4. Admin clicks "Force Release"
   └─► Admin signs with their private key
   └─► adminForceRelease(milestoneIndex) called
   └─► Funds sent to creator ✅
```

### Cancellation Path - Full Refund
```
1. Campaign cancelled (didn't reach goal, creator abandons, etc.)

2. Admin calls cancel()
   └─► Contract.cancelled = true

3. Backer calls claimCancellationRefund()
   └─► Signs with their private key
   └─► Gets FULL contribution back (not proportional)
   └─► Backer sees 10 POL returned to wallet ✅
```

---

## 🔧 New Functions Reference

### Backer Functions
```solidity
// Claim refund for rejected milestone
function claimRefund(uint256 milestoneIndex) external
// Requirements: milestone.rejected == true, not already claimed

// Claim full refund when campaign cancelled
function claimCancellationRefund() external  
// Requirements: cancelled == true, has contribution

// View pending refunds
function getPendingRefunds(address backer) external view 
    returns (uint256[] memory milestoneIndices, uint256[] memory amounts)
```

### Admin Functions
```solidity
// Force release if auto-release failed
function adminForceRelease(uint256 milestoneIndex) external onlyAdmin

// Manually reject milestone
function adminRejectMilestone(uint256 milestoneIndex, string calldata reason) 
    external onlyAdmin

// Cancel campaign
function cancel() external onlyAdmin

// Emergency manual refund
function adminRefund(address to, uint256 amountWei) external onlyAdmin
```

### Internal Functions (Auto-called)
```solidity
// Check voting results and finalize
function _checkAndFinalizeVote(uint256 milestoneIndex, Milestone storage m) 
    internal

// Auto-release to creator
function _releaseToCreator(uint256 milestoneIndex, Milestone storage m) 
    internal
```

---

## 📝 Updated Events

```solidity
event MilestoneReleased(uint256 indexed milestone, uint256 amount, address indexed to);
event MilestoneRejected(uint256 indexed milestone, string reason);
event RefundIssued(address indexed backer, uint256 indexed milestone, uint256 amount);
```

---

## 🚀 Deployment Checklist

### 1. Deploy Contract
```bash
cd smart-contracts
npx hardhat run scripts/deploy-nexafund-weighted-v2.ts --network tenderlyVTN
```

### 2. Generate TypeScript Types
```bash
npx hardhat typechain
```

### 3. Update Backend
- [ ] Update `blockchainService.ts` with new functions
- [ ] Add `claimRefund()` method
- [ ] Add `getPendingRefunds()` method
- [ ] Update `adminForceRelease()` (rename from `adminRelease`)
- [ ] Remove old `finalizeMilestone()` logic

### 4. Update Frontend
- [ ] Create `BackerRefunds.tsx` page
- [ ] Update reconciliation panel (force release only)
- [ ] Update milestone display (show `released`/`rejected` states)
- [ ] Add refund claim UI for backers

### 5. Database Schema Updates
- [ ] Add `milestone.rejected` boolean column
- [ ] Add `milestone.releasedAt` timestamp
- [ ] Add `refundClaim` table for tracking refunds

---

## ⚠️ Breaking Changes from V1

| V1 Function | V2 Replacement | Change |
|-------------|----------------|--------|
| `finalize()` | `finalize()` | Now auto-releases or rejects |
| `adminRelease()` | `adminForceRelease()` | Emergency only |
| N/A | `claimRefund()` | NEW - Backer refunds |
| N/A | `adminRejectMilestone()` | NEW - Manual rejection |
| `adminRefund()` | `claimCancellationRefund()` | Self-service refunds |
| `milestone.released` | `milestone.released` | Still exists |
| N/A | `milestone.rejected` | NEW state |

---

## 💡 Key Improvements

1. **No Creator Action Needed** - Funds auto-sent on approval
2. **Backer Protection** - Auto-refund mechanism for rejections
3. **Reduced Admin Burden** - No manual releases for normal flow
4. **Better Security** - No platform control over fund movement
5. **True Escrow** - Contract enforces rules automatically
6. **Emergency Override** - Admin can still intervene if needed

---

## 📖 Usage Examples

### For Backers
```typescript
// Contribute
await contract.contribute({ value: ethers.utils.parseEther("10") });

// Vote
await contract.voteMilestone(0, true); // Vote YES

// Claim refund if rejected
await contract.claimRefund(0);

// Check pending refunds
const [indices, amounts] = await contract.getPendingRefunds(backerAddress);
```

### For Admin
```typescript
// Open voting
await contract.openVoting(0, startTime, endTime);

// Force release (emergency)
await contract.adminForceRelease(0);

// Reject milestone manually
await contract.adminRejectMilestone(0, "Milestone requirements not met");
```

### For Backend
```typescript
// Listen for auto-releases
contract.on("MilestoneReleased", (milestoneIndex, amount, creator) => {
  // Update database: milestone.released = true
  // No action needed - creator already received funds
});

// Listen for rejections
contract.on("MilestoneRejected", (milestoneIndex, reason) => {
  // Update database: milestone.rejected = true
  // Notify backers they can claim refunds
});
```

---

## 🎯 Success Criteria

Contract is working correctly when:
- ✅ Approved milestones automatically send funds to creator
- ✅ Rejected milestones allow backers to claim refunds
- ✅ Cancelled campaigns allow full refunds
- ✅ Admin can force release only in emergencies
- ✅ No manual intervention needed for normal flow
- ✅ All state changes emit proper events
