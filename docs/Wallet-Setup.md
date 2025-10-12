# NexaFund – Virtual TestNet (VTN) Demo Guide

This guide explains how to demo NexaFund **entirely online** using a **Tenderly Virtual TestNet (VTN)** with MetaMask and large test balances.

> **TL;DR**
>
> * MetaMask uses the **Public RPC** (for wallets & dApp traffic).
> * Funding big balances uses the **Admin RPC / Tenderly dashboard** (cheatcodes).
> * Balance set = **no tx** (state update). Make a **send** to see blocks/txs.

---

## 1) Prerequisites

* MetaMask (Chrome/Brave/Edge).
* A Tenderly **Virtual TestNet (VTN)** already created (Polygon parent recommended).
* Your **Public RPC** (for MetaMask) and **Admin RPC** (keep private).

**Chain details we use in this guide**

* **Chain ID:** `73571` (hex `0x11F63`)
* **Symbol:** `POL`

---

## 2) Add NexaFund VTN to MetaMask (Public RPC)

MetaMask → **Settings → Networks → Add network manually**:

* **Network name:** `Tenderly (Nexa1)`
* **New RPC URL (Public):** `https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn`
* **Chain ID:** `73571`
* **Currency symbol:** `POL`
* **Block explorer URL:** *(Your VTN public explorer URL)*

> **Important:** Do **not** use the Admin RPC in MetaMask.

---

## 3) Fund wallets with large test balances (Admin-only)

### Option A — Tenderly Dashboard (UI)

1. Open your VTN in Tenderly (Admin view).
2. Left sidebar → **Faucet** → paste one or more addresses (one per line).
3. **Token:** Native (POL) → **Amount:** e.g., `10000` → **Fund**.

### Option B — JSON-RPC (Admin RPC)

1. Left sidebar → **JSON-RPC Calls** (ensure the **VTN** is selected).
2. Send:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tenderly_setBalance",
     "params": ["0xYOUR_ADDRESS","0x21e19e0c9bab2400000"]
   }
   ```

   * `0x21e19e0c9bab2400000` = **10,000 POL** (in wei, hex).
   * This **does not create a tx**; balance updates instantly.

### Option C — PowerShell script (saved in repo root)

We use a small script to fund any address with **10,000 POL** on the VTN.

**`Fund-Wallet.ps1`**

```powershell
param(
  [Parameter(Mandatory=$true)]
  [string]$Address
)

# Admin RPC (keep private)
$adminRpc = "https://virtual.rpc.tenderly.co/TRK/project/private/nexa-vtn/<YOUR-PRIVATE-TOKEN>"

# Validate address
if ($Address -notmatch '^0x[0-9a-fA-F]{40}$') {
  Write-Error "Invalid address: $Address"
  exit 1
}

# 10,000 POL (wei, hex)
$amountHex = "0x21e19e0c9bab2400000"

$body = @{
  jsonrpc = "2.0"
  id      = 1
  method  = "tenderly_setBalance"
  params  = @($Address, $amountHex)
} | ConvertTo-Json -Compress

try {
  $res = Invoke-WebRequest -Uri $adminRpc -Method POST -ContentType "application/json" -Body $body
  Write-Host "✅ Funded $Address with 10,000 POL (test) on NexaFund VTN."
  Write-Host "Response:" $res.Content
} catch {
  Write-Error "Funding failed: $($_.Exception.Message)"
  exit 1
}
```

**Usage**

```powershell
# One-time if scripts are blocked:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Fund a wallet
.\Fund-Wallet.ps1 -Address 0xABCD1234ABCD1234ABCD1234ABCD1234ABCD1234
```

> Keep the **Admin RPC** private. Never commit or share it.

---

## 4) Verify balance & create a real transaction

1. In MetaMask (on **NexaFund VTN**), switch to the funded account and refresh (lock/unlock).
2. Create **Account 2** (another demo wallet).
3. **Send 100 POL** from Account 1 → Account 2.
4. Click **View on Explorer** to open your VTN explorer.

   * You should now see a **new block + tx** (shareable link for demos).

---


## 5) Troubleshooting

* **MetaMask shows $ amount but no POL:** switch the display to **POL** and verify on the VTN explorer.
* **No new blocks after funding:** expected—`tenderly_setBalance` doesn’t create txs. Do a **send** or contract call.
* **“Something went wrong” (Explorer top-up):** use **Faucet** or **JSON-RPC** instead (more reliable).
* **ERR_NETWORK / parse errors (PowerShell):**

  * Use PowerShell-native:

    ```powershell
    $body = @{ jsonrpc="2.0"; id=1; method="eth_chainId"; params=@() } | ConvertTo-Json
    Invoke-WebRequest -Uri "<RPC>" -Method POST -ContentType "application/json" -Body $body
    ```
  * Or `curl.exe` with quoted JSON (not `curl` alias).
* **Cheatcode “method not found”:** you’re likely hitting **Public RPC**. Use the **Admin RPC** or the dashboard **JSON-RPC Calls** panel with your VTN selected.
* **Wrong network in MetaMask:** ensure **NexaFund VTN** (Chain ID `73571`) is selected.

---

## 6) Security Notes

* Treat the **Admin RPC** like a secret—**never** share or commit.
* Use a **burner** MetaMask account for demos.
* Public RPC and the explorer can be shared with teammates/stakeholders.

---

## 7) (Optional) Deploy contracts to VTN (Hardhat)

`.env`

```ini
VTN_RPC_URL=https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn
PRIVATE_KEY=0x<TEST_WALLET_PRIVATE_KEY>
VTN_CHAIN_ID=73571
```

`hardhat.config.ts`

```ts
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenv } from "dotenv";
dotenv();

export default {
  solidity: "0.8.24",
  networks: {
    vtn: {
      url: process.env.VTN_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: Number(process.env.VTN_CHAIN_ID || 73571),
    },
  },
};
```

Deploy:

```bash
npx hardhat run scripts/deploy.ts --network vtn
```

---

### Done

You now have an **online test chain**, **big demo balances**, **public explorer links**, and a repeatable funding script. Perfect for fast, realistic NexaFund demos.
