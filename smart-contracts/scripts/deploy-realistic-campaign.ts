import { ethers } from "hardhat";

/**
 * Deploy NexaFundWeighted with Realistic Campaign Goal
 * 
 * This deploys a contract that matches your actual campaign database values
 * Example: $10,000 campaign goal = 20,000 POL (at $0.50/POL)
 * 
 * Usage:
 * npx hardhat run scripts/deploy-realistic-campaign.ts --network tenderlyVTN
 */

async function main() {
  console.log("🚀 Deploying NexaFundWeighted with REALISTIC campaign goal...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL\n");

  // ============================================================================
  // 🎯 REALISTIC CAMPAIGN PARAMETERS
  // ============================================================================
  
  // TODO: Get these from your campaign database
  const CAMPAIGN_GOAL_USD = 10000;  // $10,000 USD goal
  const POL_PRICE_USD = 0.50;       // 1 POL = $0.50 (match frontend conversion)
  const CAMPAIGN_GOAL_POL = CAMPAIGN_GOAL_USD / POL_PRICE_USD; // 20,000 POL
  
  const CREATOR_ADDRESS = deployer.address; // Change to actual campaign creator's wallet
  const GOAL_WEI = ethers.parseEther(CAMPAIGN_GOAL_POL.toString());
  
  // Milestones: Split the goal into 3 phases (customize as needed)
  const MILESTONE_DESCRIPTIONS = [
    "Milestone 1: Research & Planning (30%)",
    "Milestone 2: Development & Prototyping (40%)", 
    "Milestone 3: Testing & Launch (30%)"
  ];
  
  // Split goal proportionally
  const phase1Amount = (CAMPAIGN_GOAL_POL * 0.30).toFixed(2); // 30% = 6,000 POL
  const phase2Amount = (CAMPAIGN_GOAL_POL * 0.40).toFixed(2); // 40% = 8,000 POL
  const phase3Amount = (CAMPAIGN_GOAL_POL * 0.30).toFixed(2); // 30% = 6,000 POL
  
  const MILESTONE_AMOUNTS = [
    ethers.parseEther(phase1Amount),
    ethers.parseEther(phase2Amount),
    ethers.parseEther(phase3Amount)
  ];
  
  // Verify milestones sum to goal (allow small rounding difference)
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
  
  console.log("⏳ Deploying NexaFundWeighted contract...");
  
  const NexaFundWeighted = await ethers.getContractFactory("NexaFundWeighted");
  const contract = await NexaFundWeighted.deploy(
    CREATOR_ADDRESS,
    GOAL_WEI,
    MILESTONE_DESCRIPTIONS,
    MILESTONE_AMOUNTS,
    MIN_QUORUM
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log();

  // ============================================================================
  // VERIFICATION
  // ============================================================================
  
  console.log("🔍 Verifying deployment...");
  
  const deployedGoal = await contract.goal();
  const deployedRaised = await contract.raised();
  const deployedCreator = await contract.creator();
  const deployedAdmin = await contract.admin();
  
  console.log("   ✓ Goal:", ethers.formatEther(deployedGoal), "POL");
  console.log("   ✓ Raised:", ethers.formatEther(deployedRaised), "POL");
  console.log("   ✓ Creator:", deployedCreator);
  console.log("   ✓ Admin:", deployedAdmin);
  console.log();

  // Check milestones
  console.log("📊 Milestones:");
  for (let i = 0; i < MILESTONE_DESCRIPTIONS.length; i++) {
    const milestone = await contract.milestones(i);
    console.log(`   ${i + 1}. ${milestone.description}`);
    console.log(`      Amount: ${ethers.formatEther(milestone.amount)} POL`);
    console.log(`      Released: ${milestone.released}`);
  }
  console.log();

  // ============================================================================
  // DEPLOYMENT SUMMARY
  // ============================================================================
  
  const deploymentInfo = {
    network: "Tenderly VTN",
    chainId: 73571,
    contractAddress: contractAddress,
    creatorAddress: CREATOR_ADDRESS,
    goalUSD: CAMPAIGN_GOAL_USD,
    goalPOL: CAMPAIGN_GOAL_POL,
    polPrice: POL_PRICE_USD,
    milestones: MILESTONE_DESCRIPTIONS.length,
    minQuorum: ethers.formatEther(MIN_QUORUM),
    deployedAt: new Date().toISOString(),
    deployerAddress: deployer.address
  };

  console.log("📄 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(80));
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("=" .repeat(80));
  console.log();

  // ============================================================================
  // NEXT STEPS
  // ============================================================================
  
  console.log("✅ NEXT STEPS:");
  console.log();
  console.log("1️⃣  Update your campaign in the database:");
  console.log(`   UPDATE campaigns SET "contractAddress" = '${contractAddress}' WHERE id = 'YOUR_CAMPAIGN_ID';`);
  console.log();
  console.log("2️⃣  Update frontend .env file:");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log();
  console.log("3️⃣  Restart the frontend:");
  console.log("   cd frontend");
  console.log("   npm run dev");
  console.log();
  console.log("4️⃣  Test contribution:");
  console.log(`   - Try contributing $250 (→ ${250 / POL_PRICE_USD} POL)`);
  console.log(`   - Should work now! Goal is ${CAMPAIGN_GOAL_POL} POL`);
  console.log();
  console.log("🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
