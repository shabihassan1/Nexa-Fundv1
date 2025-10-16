import { ethers } from "hardhat";

async function main() {
  console.log("\n🚀 Deploying NexaFundV3 Contract...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "POL\n");

  // Campaign parameters
  const creatorAddress = "0xDBc0C9a06362C941f4CD2380B88b188b955Ea68a"; // Same as admin for testing
  const goalPOL = ethers.parseEther("10000"); // 10,000 POL ($5,000)
  
  // 3 Milestones: 30%, 40%, 30%
  const milestoneAmounts = [
    ethers.parseEther("3000"),  // Milestone 1: 3,000 POL
    ethers.parseEther("4000"),  // Milestone 2: 4,000 POL
    ethers.parseEther("3000")   // Milestone 3: 3,000 POL
  ];

  console.log("📋 Contract Parameters:");
  console.log("   Creator:", creatorAddress);
  console.log("   Goal:", ethers.formatEther(goalPOL), "POL");
  console.log("   Milestones:", milestoneAmounts.length);
  console.log("   - Milestone 1:", ethers.formatEther(milestoneAmounts[0]), "POL (30%)");
  console.log("   - Milestone 2:", ethers.formatEther(milestoneAmounts[1]), "POL (40%)");
  console.log("   - Milestone 3:", ethers.formatEther(milestoneAmounts[2]), "POL (30%)");
  console.log();

  // Deploy contract
  const NexaFundV3 = await ethers.getContractFactory("NexaFundV3");
  const contract = await NexaFundV3.deploy(
    creatorAddress,
    goalPOL,
    milestoneAmounts
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ NexaFundV3 deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("👤 Admin:", await contract.admin());
  console.log("🎯 Creator:", await contract.creator());
  console.log("💰 Goal:", ethers.formatEther(await contract.goal()), "POL");
  console.log("📊 Milestones:", await contract.getMilestonesCount());

  // Verify contract state
  console.log("\n🔍 Verifying Contract State:");
  for (let i = 0; i < milestoneAmounts.length; i++) {
    const milestone = await contract.getMilestone(i);
    console.log(`   Milestone ${i + 1}:`, ethers.formatEther(milestone.amount), "POL", 
                `(Released: ${milestone.released}, Rejected: ${milestone.rejected})`);
  }

  console.log("\n📝 SAVE THIS INFO:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("CONTRACT_ADDRESS=\"" + contractAddress + "\"");
  console.log("CREATOR_ADDRESS=\"" + creatorAddress + "\"");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n✨ Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
