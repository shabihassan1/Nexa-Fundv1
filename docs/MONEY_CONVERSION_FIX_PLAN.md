# Money Conversion Investigation & Fix Plan

## 🔍 PROBLEM IDENTIFIED

### Current Flow:
1. **User Input:** $200 USD
2. **Frontend Conversion:** $200 ÷ $0.50 = **400 POL** (WRONG PRICE!)
3. **Smart Contract:** Receives 400 POL
4. **Backend Database:** Saves $200 USD
5. **MetaMask Shows:** ~$45 deducted (because 400 POL ≈ $45 at real price)

### Root Cause:
**File:** `frontend/src/utils/walletConnector.ts` Line 199
```typescript
const polPriceInUSD = 0.50; // HARDCODED WRONG VALUE
```

**Real POL Price (Oct 2025):** ~$0.11 per POL
**Result:** System thinks 1 POL = $0.50, but it's actually worth ~$0.11

---

## 📊 EXAMPLE CALCULATION

### What Happens Now:
- User wants to contribute: **$200**
- Frontend calculates: $200 ÷ $0.50 = **400 POL**
- Smart Contract receives: **400 POL**
- Real value of 400 POL: 400 × $0.11 = **~$44** (MetaMask shows this)
- Database stores: **$200** (wrong!)
- Display shows: **$200** (wrong!)

### What Should Happen:
- User wants to contribute: **$200**
- Frontend gets real price: **1 POL = $0.11**
- Frontend calculates: $200 ÷ $0.11 = **1,818 POL**
- Smart Contract receives: **1,818 POL**
- Real value: 1,818 × $0.11 = **$200** ✅
- Database stores: **$200** ✅
- Display shows: **$200** ✅

---

## 🎯 FIX PLAN

### Option A: Use Real-Time Price Oracle (RECOMMENDED)
**Pros:** Always accurate, handles price fluctuations
**Cons:** Requires API integration

**Steps:**
1. Integrate CoinGecko/CoinMarketCap API for POL/USD price
2. Fetch price before each transaction
3. Cache price for 5 minutes to reduce API calls
4. Update `walletConnector.ts` to use real price

**Files to Update:**
- `frontend/src/utils/priceOracle.ts` (NEW - price fetching service)
- `frontend/src/utils/walletConnector.ts` (use price oracle)
- `frontend/.env` (add API key if needed)

### Option B: Use Static Updated Price (QUICK FIX)
**Pros:** Simple, no API needed
**Cons:** Needs manual updates, inaccurate over time

**Steps:**
1. Research current POL price
2. Update hardcoded value in `walletConnector.ts`
3. Add comment with update date

**Files to Update:**
- `frontend/src/utils/walletConnector.ts` (line 199)

### Option C: Store POL Amount Instead of USD (HYBRID)
**Pros:** Smart contract is source of truth
**Cons:** Requires backend/frontend changes

**Steps:**
1. Store both USD and POL amounts in database
2. Calculate USD value from POL at time of contribution
3. Display can show both values
4. Smart contract POL amount is authoritative

**Files to Update:**
- `backend/prisma/schema.prisma` (add `amountInPOL` field)
- `backend/src/controllers/contribution.controller.ts`
- `frontend/src/utils/walletConnector.ts`
- `frontend/src/components/BackingModal.tsx`

---

## 🚀 RECOMMENDED SOLUTION: Option A + C Hybrid

### Phase 1: Immediate Fix (Option B)
1. Update POL price to realistic value ($0.11)
2. Test with small amounts
3. Deploy quickly

### Phase 2: Proper Solution (Option A + C)
1. **Add Price Oracle:**
   - Create `priceOracle.ts` service
   - Integrate CoinGecko free API (no key needed)
   - Cache prices for 5 min

2. **Update Database Schema:**
   - Add `amountInPOL` to Contribution model
   - Store both USD and POL amounts
   - Add `polPriceAtTime` to track conversion rate

3. **Update Backend:**
   - Accept both USD and POL amounts
   - Validate amounts match conversion
   - Store both values

4. **Update Frontend:**
   - Show conversion preview before transaction
   - Display: "$200 (≈ 1,818 POL at $0.11/POL)"
   - Store actual POL sent in database

---

## 🔧 TECHNICAL IMPLEMENTATION

### Price Oracle Service Structure:
```typescript
// frontend/src/utils/priceOracle.ts
export async function getPOLPrice(): Promise<number> {
  // 1. Check cache (localStorage with 5min expiry)
  // 2. If expired, fetch from CoinGecko
  // 3. Update cache
  // 4. Return price
}

export function convertUSDToPOL(usd: number, polPrice: number): number {
  return usd / polPrice;
}

export function convertPOLToUSD(pol: number, polPrice: number): number {
  return pol * polPrice;
}
```

### Database Schema Update:
```prisma
model Contribution {
  // ... existing fields
  amount         Float   // USD amount (for display)
  amountInPOL    Float   // POL amount (source of truth)
  polPriceAtTime Float   // Price at contribution time
}
```

---

## ⚠️ CRITICAL FIXES NEEDED

### Fix 1: walletConnector.ts Line 199
**Current:**
```typescript
const polPriceInUSD = 0.50; // WRONG!
```

**Quick Fix:**
```typescript
const polPriceInUSD = 0.11; // Updated Oct 2025
```

**Proper Fix:**
```typescript
const polPriceInUSD = await getPOLPrice(); // Real-time
```

### Fix 2: Show Conversion Preview
**Add to BackingModal.tsx:**
```tsx
<div className="conversion-preview">
  Contributing: ${amount} USD
  ≈ {(amount / polPrice).toFixed(2)} POL
  (at ${polPrice}/POL)
</div>
```

### Fix 3: Backend Validation
**Add to contribution.controller.ts:**
```typescript
// Validate POL amount matches USD at current rate
const expectedPOL = amountUSD / polPrice;
const tolerance = 0.05; // 5% tolerance for price changes
if (Math.abs(amountInPOL - expectedPOL) / expectedPOL > tolerance) {
  throw new Error('Price changed, please retry');
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Immediate (Quick Fix):
- [ ] Update hardcoded POL price to $0.11 in walletConnector.ts
- [ ] Test with $10 contribution
- [ ] Verify MetaMask and database amounts match

### Short Term (Price Oracle):
- [ ] Create priceOracle.ts service
- [ ] Integrate CoinGecko API
- [ ] Add price caching logic
- [ ] Update walletConnector.ts to use oracle
- [ ] Add conversion preview to UI

### Long Term (Database Updates):
- [ ] Add migration for amountInPOL field
- [ ] Update backend to accept POL amount
- [ ] Store both USD and POL in database
- [ ] Update displays to show both values
- [ ] Add price history tracking

---

## 🧪 TESTING PLAN

1. **Test Small Amount:** $10 contribution
   - Expected: ~91 POL sent (at $0.11/POL)
   - Verify MetaMask shows $10 worth
   - Verify database stores $10

2. **Test Large Amount:** $200 contribution
   - Expected: ~1,818 POL sent
   - Verify all amounts match

3. **Test Edge Cases:**
   - Price API down (fallback to cached price)
   - Very small amounts (<$1)
   - Amounts with many decimals

---

## 📊 FILES AFFECTED

**Frontend:**
- `src/utils/walletConnector.ts` ⚠️ CRITICAL
- `src/utils/priceOracle.ts` (NEW)
- `src/components/BackingModal.tsx`
- `.env` (add API config)

**Backend:**
- `src/controllers/contribution.controller.ts`
- `prisma/schema.prisma` (if adding amountInPOL)

**Smart Contract:**
- No changes needed ✅ (already works correctly)

---

## 🎯 NEXT STEPS

**Do you want me to:**
1. ✅ Apply quick fix (update price to $0.11)?
2. ✅ Implement full price oracle solution?
3. ✅ Add database fields for POL amounts?
4. ✅ All of the above?

**Priority:** Quick fix first (5 min), then proper solution (30 min)
