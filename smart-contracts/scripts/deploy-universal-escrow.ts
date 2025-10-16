import { ethers } from 'hardhat';

async function main() {
  console.log('🚀 Deploying UniversalEscrow Contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'POL\n');

  // Deploy UniversalEscrow
  const UniversalEscrow = await ethers.getContractFactory('UniversalEscrow');
  const escrow = await UniversalEscrow.deploy();
  await escrow.waitForDeployment();

  const contractAddress = await escrow.getAddress();
  console.log('✅ UniversalEscrow deployed to:', contractAddress);
  console.log('✅ Admin:', deployer.address);
  
  // Verify deployment
  const contractBalance = await escrow.getBalance();
  const admin = await escrow.admin();
  const backerCount = await escrow.getBackerCount();
  
  console.log('\n📊 Contract State:');
  console.log('   Balance:', ethers.formatEther(contractBalance), 'POL');
  console.log('   Admin:', admin);
  console.log('   Backers:', backerCount.toString());
  
  console.log('\n📝 How to Use:');
  console.log('   1. Backers send funds directly to contract address');
  console.log('   2. Contract tracks deposits[backerAddress]');
  console.log('   3. Backend calls release(creatorAddress, amount, "Milestone X approved")');
  console.log('   4. Backend calls refund(backerAddress, amount, "Milestone Y rejected")');
  
  console.log('\n🔧 Update Your .env Files:');
  console.log(`   CONTRACT_ADDRESS="${contractAddress}"`);
  console.log(`   VITE_CONTRACT_ADDRESS="${contractAddress}"`);
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Update backend/.env with new contract address');
  console.log('   2. Update frontend/.env with new contract address');
  console.log('   3. Copy ABI to backend/src/abi/UniversalEscrow.json');
  console.log('   4. Copy ABI to frontend/src/abi/UniversalEscrow.json');
  console.log('   5. Update blockchainService.ts to use new contract');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
