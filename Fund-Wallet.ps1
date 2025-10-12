param(
  [Parameter(Mandatory=$true)]
  [string]$Address
)

# --- Admin RPC (do NOT share publicly) ---
$adminRpc = "https://virtual.rpc.tenderly.co/TRK/project/private/nexa-vtn/e59896c3-bc5c-4b0b-a100-0ea8bafea432"

# --- Validate address format (0x + 40 hex chars) ---
if ($Address -notmatch '^0x[0-9a-fA-F]{40}$') {
  Write-Error "Invalid address: $Address"
  exit 1
}

# --- 10,000 POL in wei (hex) ---
$amountHex = "0x21e19e0c9bab2400000"

# --- Build JSON-RPC body ---
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
