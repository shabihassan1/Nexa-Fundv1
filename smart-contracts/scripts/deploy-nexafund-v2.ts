import { ethers } from "hardhat";

/**
 * Deploy NexaFundWeightedV2 - TRUE ESCROW CONTRACT
 * 
 * This deploys the V2 contract with:
 * - Auto-release to creator when milestone approved
 * - Auto-refund system for rejected milestones
 * - Campaign cancellation refunds
 * - Admin emergency force-release
 * 
 * Usage:
 * npx hardhat run scripts/deploy-nexafund-v2.ts --network tenderlyVTN
 */

async function main() {
  console.log("🚀 Deploying NexaFundWeightedV2 (TRUE ESCROW CONTRACT)...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL\n");

  // ============================================================================
  // 🎯 CAMPAIGN PARAMETERS - CUSTOMIZE THESE
  // ============================================================================
  
  const CAMPAIGN_GOAL_USD = 10000;  // $10,000 USD goal
  const POL_PRICE_USD = 0.50;       // 1 POL = $0.50 (match frontend conversion)
  const CAMPAIGN_GOAL_POL = CAMPAIGN_GOAL_USD / POL_PRICE_USD; // 20,000 POL
  
  const CREATOR_ADDRESS = deployer.address; // TODO: Change to actual campaign creator's wallet
  const GOAL_WEI = ethers.parseEther(CAMPAIGN_GOAL_POL.toString());
  
  // Milestones: Split the goal into 3 phases
  const MILESTONE_DESCRIPTIONS = [
    "Milestone 1: Research & Planning (30%)",
    "Milestone 2: Development & Prototyping (40%)", 
    "Milestone 3: Testing & Launch (30%)"
  ];
  
  // Split goal proportionally
  const phase1Amount = (CAMPAIGN_GOAL_POL * 0.30).toFixed(2); // 30%
  const phase2Amount = (CAMPAIGN_GOAL_POL * 0.40).toFixed(2); // 40%
  const phase3Amount = (CAMPAIGN_GOAL_POL * 0.30).toFixed(2); // 30%
  
  const MILESTONE_AMOUNTS = [
    ethers.parseEther(phase1Amount),
    ethers.parseEther(phase2Amount),
    ethers.parseEther(phase3Amount)
  ];
  
  // Verify milestones sum to goal
  const milestoneSum = MILESTONE_AMOUNTS.reduce((sum, amt) => sum + amt, 0n);
  const difference = milestoneSum > GOAL_WEI ? milestoneSum - GOAL_WEI : GOAL_WEI - milestoneSum;
  const tolerance = ethers.parseEther("0.01"); // 0.01 POL tolerance
  
  if (difference > tolerance) {
    throw new Error(
      `❌ Milestone amounts (${ethers.formatEther(milestoneSum)} POL) must equal goal (${CAMPAIGN_GOAL_POL} POL)\n` +
      `Difference: ${ethers.formatEther(difference)} POL`
    );
  }
  
  // Minimum quorum: 10% of goal must vote
  const MIN_QUORUM = GOAL_WEI / 10n;
  
  console.log("📋 Campaign Configuration:");
  console.log("   Goal (USD):", `$${CAMPAIGN_GOAL_USD.toLocaleString()}`);
  console.log("   Goal (POL):", CAMPAIGN_GOAL_POL.toLocaleString(), "POL");
  console.log("   Creator:", CREATOR_ADDRESS);
  console.log("   Milestones:", MILESTONE_DESCRIPTIONS.length);
  console.log("   - Phase 1:", phase1Amount, "POL (30%)");
  console.log("   - Phase 2:", phase2Amount, "POL (40%)");
  console.log("   - Phase 3:", phase3Amount, "POL (30%)");
  console.log("   Min Quorum:", ethers.formatEther(MIN_QUORUM), "POL (10%)");
  console.log();

  // ============================================================================
  // DEPLOY CONTRACT
  // ============================================================================
  
  console.log("⏳ Deploying NexaFundWeightedV2 contract...");
  
  const NexaFundWeightedV2 = await ethers.getContractFactory("NexaFundWeightedV2");
  const contract = await NexaFundWeightedV2.deploy(
    CREATOR_ADDRESS,
    GOAL_WEI,
    MILESTONE_DESCRIPTIONS,
    MILESTONE_AMOUNTS,
    MIN_QUORUM
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ Contract deployed!");
  console.log("📍 Contract address:", contractAddress);
  console.log();

  // ============================================================================
  // VERIFY DEPLOYMENT
  // ============================================================================
  
  console.log("🔍 Verifying deployment...");
  
  const admin = await contract.admin();
  const creator = await contract.creator();
  const goal = await contract.goal();
  const milestoneCount = await contract.getMilestoneCount();
  
  console.log("   Admin:", admin);
  console.log("   Creator:", creator);
  console.log("   Goal:", ethers.formatEther(goal), "POL");
  console.log("   Milestones:", milestoneCount.toString());
  console.log();
  
  // Display each milestone
  for (let i = 0; i < Number(milestoneCount); i++) {
    const milestone = await contract.getMilestone(i);
    console.log(`   Milestone ${i + 1}:`);
    console.log(`      Description: ${milestone.description}`);
    console.log(`      Amount: ${ethers.formatEther(milestone.amount)} POL`);
    console.log(`      Released: ${milestone.released}`);
    console.log(`      Rejected: ${milestone.rejected}`);
  }
  console.log();

  // ============================================================================
  // SAVE DEPLOYMENT INFO
  // ============================================================================
  
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    contractVersion: "V2",
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    deployer: deployer.address,
    creator: CREATOR_ADDRESS,
    goalUSD: CAMPAIGN_GOAL_USD,
    goalPOL: CAMPAIGN_GOAL_POL,
    milestones: MILESTONE_DESCRIPTIONS.map((desc, i) => ({
      index: i,
      description: desc,
      amount: ethers.formatEther(MILESTONE_AMOUNTS[i])
    })),
    deployedAt: new Date().toISOString(),
    txHash: contract.deploymentTransaction()?.hash || "N/A"
  };
  
  console.log("📄 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log();
  
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📝 NEXT STEPS:");
  console.log("═══════════════════════════════════════════════════════════");
  console.log();
  console.log("1️⃣  Update Backend Environment (.env):");
  console.log("   ---------------------------------------------");
  console.log(`   CONTRACT_ADDRESS="${contractAddress}"`);
  console.log(`   TENDERLY_RPC_URL="https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn"`);
  console.log(`   CHAIN_ID="73571"`);
  console.log(`   ADMIN_PRIVATE_KEY="<your_admin_private_key>"`);
  console.log();
  console.log("2️⃣  Update Frontend Environment (.env):");
  console.log("   ---------------------------------------------");
  console.log(`   VITE_CONTRACT_ADDRESS="${contractAddress}"`);
  console.log(`   VITE_TENDERLY_RPC_URL="https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn"`);
  console.log(`   VITE_CHAIN_ID="73571"`);
  console.log();
  console.log("3️⃣  Update Database (if campaign exists):");
  console.log("   ---------------------------------------------");
  console.log(`   UPDATE campaigns SET "contractAddress" = '${contractAddress}'`);
  console.log(`   WHERE id = 'YOUR_CAMPAIGN_ID';`);
  console.log();
  console.log("4️⃣  Generate TypeScript Types:");
  console.log("   ---------------------------------------------");
  console.log("   npx hardhat typechain");
  console.log();
  console.log("5️⃣  Copy ABI to Frontend:");
  console.log("   ---------------------------------------------");
  console.log("   Copy smart-contracts/artifacts/contracts/NexaFundWeightedV2.sol/NexaFundWeightedV2.json");
  console.log("   To   frontend/src/abi/NexaFundWeightedV2.json");
  console.log();
  console.log("6️⃣  Restart Backend & Frontend:");
  console.log("   ---------------------------------------------");
  console.log("   cd backend && npm run dev");
  console.log("   cd frontend && npm run dev");
  console.log();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🎯 V2 CONTRACT FEATURES:");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✅ Auto-release to creator when milestone approved");
  console.log("✅ Auto-refund system for rejected milestones");
  console.log("✅ Campaign cancellation with full refunds");
  console.log("✅ Admin emergency force-release");
  console.log("✅ Backer self-service refund claims");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
