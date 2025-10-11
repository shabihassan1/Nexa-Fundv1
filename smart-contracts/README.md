# Nexa Fund Smart Contracts

Milestone-based escrow to hold all contributions on-chain and release funds per milestone after off-chain voting and admin execution.

Stack
- Hardhat + ethers v5
- Solidity 0.8.24
- Polygon Amoy testnet (default), local Hardhat network

Setup
1. cd smart-contracts
2. Copy .env.example to .env and set keys
3. npm install
4. npx hardhat compile

Env (.env)
- PRIVATE_KEY=0x...
- AMOY_RPC_URL=...
- CAMPAIGN_OWNER=0x...
- PLATFORM_ADMIN=0x...

Deploy
- Local: npm run deploy:local
- Amoy: npm run deploy:amoy

Contract Overview (MilestoneEscrow)
- contribute(): accepts ETH; keeps all funds escrowed
- addMilestone(amount): admin reserves amount for a milestone
- releaseMilestone(index): admin releases reserved amount to the campaign owner (after voting off-chain)
- cancelCampaign(): admin cancels campaign for refunds
- adminRefund(to, amount): admin refunds a backer from remaining balance

Next
- Integrate with backend services to:
  - On campaign creation: deploy a new escrow instance and store address
  - On contribution: call contribute() with value
  - On approval: call releaseMilestone(index)
  - On cancel: call cancelCampaign() and process refunds


