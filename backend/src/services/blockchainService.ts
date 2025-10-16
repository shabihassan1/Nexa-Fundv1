import { ethers } from 'ethers';
import UniversalEscrowArtifact from '../abi/UniversalEscrow.json';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x2d070bc3dD546a08d603ff1d9640e430CE9F75DB';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '';
const RPC_URL = process.env.TENDERLY_RPC_URL || 'https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn';

/**
 * BlockchainService - UniversalEscrow Integration
 * 
 * Philosophy: Contract is Pure Payment Processor
 * 
 * Features:
 * - Contract only tracks wallet deposits
 * - No campaign/milestone registration needed
 * - Backend handles ALL business logic (campaigns, milestones, voting)
 * - Admin releases funds to creator address when milestone approved
 * - Admin refunds funds to backer addresses when milestone rejected
 * - Complete separation of concerns: blockchain = escrow, backend = platform
 */
export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private adminSigner: ethers.Wallet;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    
    // Only initialize admin signer if private key is provided
    if (!ADMIN_PRIVATE_KEY || ADMIN_PRIVATE_KEY.trim() === '') {
      console.warn('⚠️ ADMIN_PRIVATE_KEY not set - blockchain admin functions will not work');
      // Create a dummy signer just to prevent errors
      this.adminSigner = new ethers.Wallet('0x0000000000000000000000000000000000000000000000000000000000000001', this.provider);
    } else {
      this.adminSigner = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider);
    }
    
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      UniversalEscrowArtifact.abi,
      this.adminSigner
    );

    console.log(`[BlockchainService] Initialized with UniversalEscrow: ${CONTRACT_ADDRESS}`);
  }

  /**
   * Get total contract balance
   * @returns Total POL held in escrow
   */
  async getContractBalance(): Promise<string> {
    try {
      const balance = await this.contract.getBalance();
      return ethers.utils.formatEther(balance);
    } catch (error: any) {
      console.error('[Blockchain] Error getting contract balance:', error);
      throw new Error(`Failed to get contract balance: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get backer's total deposits
   * @param backerAddress - Wallet address of the backer
   * @returns Amount deposited by this backer
   */
  async getBackerDeposits(backerAddress: string): Promise<string> {
    try {
      const deposits = await this.contract.getContribution(backerAddress);
      return ethers.utils.formatEther(deposits);
    } catch (error: any) {
      console.error('[Blockchain] Error getting backer deposits:', error);
      throw new Error(`Failed to get backer deposits: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Release funds to creator after milestone approval
   * @param receiverAddress - Creator's wallet address
   * @param amountInPOL - Amount to release (in POL, not wei)
   * @param reason - Optional reason for release (for logging)
   * @returns Transaction hash
   * 
   * Note: This should only be called after backend validates:
   * - Quorum met (60% of milestone amount voted)
   * - Approval met (60% of votes are YES)
   * - All voted OR voting period ended
   */
  async releaseFunds(receiverAddress: string, amountInPOL: string, reason?: string): Promise<string> {
    try {
      console.log(`[Blockchain] Releasing ${amountInPOL} POL to ${receiverAddress}`);
      if (reason) console.log(`[Blockchain] Reason: ${reason}`);
      
      const amountWei = ethers.utils.parseEther(amountInPOL);
      const tx = await this.contract.release(receiverAddress, amountWei, reason || 'Milestone approved');
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] ✅ Funds released, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error releasing funds:', error);
      throw new Error(`Failed to release funds: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Refund funds to backer after milestone rejection
   * @param backerAddress - Backer's wallet address
   * @param amountInPOL - Amount to refund (in POL, not wei)
   * @param reason - Optional reason for refund (for logging)
   * @returns Transaction hash
   * 
   * Note: This should only be called after backend validates rejection
   */
  async refundFunds(backerAddress: string, amountInPOL: string, reason?: string): Promise<string> {
    try {
      console.log(`[Blockchain] Refunding ${amountInPOL} POL to ${backerAddress}`);
      if (reason) console.log(`[Blockchain] Reason: ${reason}`);
      
      const amountWei = ethers.utils.parseEther(amountInPOL);
      const tx = await this.contract.refund(backerAddress, amountWei, reason || 'Milestone rejected');
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] 💰 Refund sent, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error refunding funds:', error);
      throw new Error(`Failed to refund funds: ${error?.message || 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
