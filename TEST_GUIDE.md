# 🧪 Quick Test Guide - Verify Escrow Works!

## Step 1: Start Your Servers

```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

---

## Step 2: Test Wallet Connection

1. Open http://localhost:8080
2. Click "Connect Wallet"
3. **Expected**: MetaMask prompts to add "NexaFund VTN"
4. Click "Approve"
5. **Expected**: Toast says "using POL"

---

## Step 3: Test Backing (THE IMPORTANT ONE!)

1. Navigate to any campaign
2. Click "Back This Project"
3. **Check the modal says:**
   - "sending POL to the escrow contract"
   - "Funds are released to the creator after milestone approvals"
4. Enter amount: $10
5. Click "Back This Project"
6. **MetaMask opens** - Check the "To" address is:
   ```
   0xaB37c74fD8598CF891990Ad69E84D94014AE8Aa9
   ```
   (This is your escrow contract, NOT the creator's wallet!)
7. Click "Confirm"
8. Wait for confirmation
9. **Expected Toast**: "Funds are held in escrow"

---

## Step 4: Verify Escrow (Proof It Worked!)

Open browser console (F12) and run:

```javascript
// Connect to your contract
const provider = new ethers.providers.JsonRpcProvider(
  "https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn"
);

const contractAddress = "0xaB37c74fD8598CF891990Ad69E84D94014AE8Aa9";
const abi = ["function raised() view returns (uint256)"];

const contract = new ethers.Contract(contractAddress, abi, provider);

// Check how much was raised
const raised = await contract.raised();
console.log("💰 Total in escrow:", ethers.utils.formatEther(raised), "POL");

// Check contract balance
const balance = await provider.getBalance(contractAddress);
console.log("🔒 Contract balance:", ethers.utils.formatEther(balance), "POL");
```

**Expected**: Both values should show your contribution amount!

---

## Step 5: Verify Creator Did NOT Receive Direct Payment

1. Get the campaign creator's wallet address from the campaign page
2. Check their balance in MetaMask or browser console:

```javascript
const creatorAddress = "0x..."; // Creator's wallet
const creatorBalance = await provider.getBalance(creatorAddress);
console.log("Creator balance:", ethers.utils.formatEther(creatorBalance), "POL");
```

3. Compare with balance BEFORE you backed
4. **Expected**: Balance should be UNCHANGED (maybe just gas fees)
5. **This proves funds are in escrow, not sent directly!**

---

## ✅ Success Checklist

- [ ] MetaMask switched to "NexaFund VTN" (Chain ID: 73571)
- [ ] UI shows "POL" not "ETH"
- [ ] Modal mentions "escrow contract"
- [ ] Transaction went to `0xaB37...` (contract address)
- [ ] `contract.raised()` shows your contribution
- [ ] Contract balance matches raised amount
- [ ] Creator's balance unchanged (no direct payment!)
- [ ] Toast said "held in escrow"

---

## 🎉 If All Checks Pass

**CONGRATULATIONS!** Your escrow system works! 

You now have:
- ✅ Funds locked in smart contract
- ✅ NOT sent directly to creator
- ✅ Will only be released after milestone voting
- ✅ True decentralized escrow

---

## 🆘 If Something Doesn't Work

### MetaMask Doesn't Switch
- Manually add network in MetaMask:
  - Network Name: NexaFund VTN
  - RPC URL: https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn
  - Chain ID: 73571
  - Currency: POL

### Transaction Fails
- Check you have POL in your wallet
- Verify you're on Chain ID 73571
- Clear cache and restart dev server

### Still Shows "ETH"
- Check `frontend/.env` has `VITE_NATIVE_SYMBOL=POL`
- Restart frontend: `npm run dev`

### Funds Went to Creator (Not Escrow!)
- Check `walletConnector.ts` imports `contributeToContract`
- Clear browser cache completely
- Hard refresh (Ctrl+Shift+R)

---

**Ready to test? Follow these steps and let me know the results!** 🚀
