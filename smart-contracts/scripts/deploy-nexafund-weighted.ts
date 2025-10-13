import { ethers } from "hardhat";

/**
 * Deploy NexaFundWeighted Contract
 * 
 * This script deploys a single campaign contract with milestone-based escrow
 * 
 * Usage:
 * npx hardhat run scripts/deploy-nexafund-weighted.ts --network tenderlyVTN
 */

async function main() {
  console.log("🚀 Starting NexaFundWeighted deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL\n");

  // ============================================================================
  // CONTRACT PARAMETERS - CUSTOMIZE THESE FOR EACH CAMPAIGN
  // ============================================================================
  
  const CREATOR_ADDRESS = deployer.address; // Change to actual creator wallet
  const GOAL_IN_POL = "10"; // 10 POL goal
  const GOAL_WEI = ethers.parseEther(GOAL_IN_POL);
  
  // Milestones: Descriptions
  const MILESTONE_DESCRIPTIONS = [
    "Phase 1: Initial Development & Prototype",
    "Phase 2: Beta Testing & User Feedback", 
    "Phase 3: Final Launch & Marketing"
  ];
  
  // Milestones: Amounts (must sum to GOAL)
  const MILESTONE_AMOUNTS = [
    ethers.parseEther("3"),  // 3 POL for Phase 1
    ethers.parseEther("4"),  // 4 POL for Phase 2
    ethers.parseEther("3")   // 3 POL for Phase 3
  ];
  
  // Verify milestones sum to goal
  const milestoneSum = MILESTONE_AMOUNTS.reduce((sum, amt) => sum + amt, 0n);
  if (milestoneSum !== GOAL_WEI) {
    throw new Error(`❌ Milestone amounts (${ethers.formatEther(milestoneSum)} POL) must equal goal (${GOAL_IN_POL} POL)`);
  }
  
  // Minimum quorum: 10% of goal must vote
  const MIN_QUORUM = GOAL_WEI / 10n;
  
  console.log("📋 Deployment Parameters:");
  console.log("   Creator:", CREATOR_ADDRESS);
  console.log("   Goal:", GOAL_IN_POL, "POL");
  console.log("   Milestones:", MILESTONE_DESCRIPTIONS.length);
  console.log("   Min Quorum:", ethers.formatEther(MIN_QUORUM), "POL");
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
  }
  console.log();

  // ============================================================================
  // SAVE DEPLOYMENT INFO
  // ============================================================================
  
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: contractAddress,
    deployer: deployer.address,
    creator: CREATOR_ADDRESS,
    goal: GOAL_IN_POL,
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
  console.log("📝 NEXT STEPS:");
  console.log("1. Save contract address to your backend database:");
  console.log(`   Campaign.contractAddress = "${contractAddress}"`);
  console.log();
  console.log("2. Update frontend .env with:");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log();
  console.log("3. Test contribution:");
  console.log(`   contract.contribute({ value: parseEther("1") })`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
