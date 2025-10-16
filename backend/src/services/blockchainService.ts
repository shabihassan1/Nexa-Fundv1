import { ethers } from 'ethers';
import NexaFundWeightedV2Artifact from '../abi/NexaFundWeightedV2.json';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xa2878c85037A9D15C56d96CbD90a044e67f1358D';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '';
const RPC_URL = process.env.TENDERLY_RPC_URL || 'https://virtual.rpc.tenderly.co/TRK/project/public/nexa-vtn';

/**
 * BlockchainService - V2 Contract Integration
 * 
 * V2 Features:
 * - Auto-release to creator when milestone approved (no manual release needed)
 * - Auto-refund system for rejected milestones
 * - Backer self-service refund claims
 * - Admin emergency functions only (force release, reject milestone)
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
      NexaFundWeightedV2Artifact.abi,
      this.adminSigner
    );

    console.log(`[BlockchainService] Initialized with V2 contract: ${CONTRACT_ADDRESS}`);
  }

  /**
   * Open voting for a milestone
   * @param milestoneIndex - Index in contract milestones array (0-based)
   * @param durationDays - Voting period in days (default 7)
   * @returns Transaction hash
   */
  async openVoting(milestoneIndex: number, durationDays: number = 7): Promise<string> {
    try {
      const start = Math.floor(Date.now() / 1000);
      const end = start + (durationDays * 24 * 60 * 60);
      
      console.log(`[Blockchain] Opening voting for milestone ${milestoneIndex}, ${durationDays} days`);
      
      const tx = await this.contract.openVoting(milestoneIndex, start, end);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Voting opened, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error opening voting:', error);
      throw new Error(`Failed to open voting: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Cast vote on milestone (must be called by backer's wallet)
   * @param milestoneIndex - Index in contract milestones array
   * @param approve - true for YES, false for NO
   * @param voterPrivateKey - Voter's private key for signing
   * @returns Transaction hash
   */
  async voteMilestone(
    milestoneIndex: number, 
    approve: boolean, 
    voterPrivateKey: string
  ): Promise<string> {
    try {
      // Create signer with voter's private key
      const voterSigner = new ethers.Wallet(voterPrivateKey, this.provider);
      const contractWithVoter = this.contract.connect(voterSigner);
      
      console.log(`[Blockchain] Voting ${approve ? 'YES' : 'NO'} on milestone ${milestoneIndex}`);
      
      const tx = await contractWithVoter.voteMilestone(milestoneIndex, approve);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Vote recorded, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error voting:', error);
      throw new Error(`Failed to vote: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get milestone data from smart contract (V2)
   * @param milestoneIndex - Index in contract milestones array
   * @returns Milestone data including vote results and rejection status
   */
  async getMilestoneData(milestoneIndex: number): Promise<{
    description: string;
    amount: string;
    released: boolean;
    rejected: boolean;
    yesPower: string;
    noPower: string;
    voteStart: number;
    voteEnd: number;
  }> {
    try {
      const data = await this.contract.getMilestone(milestoneIndex);
      
      return {
        description: data.description,
        amount: ethers.utils.formatEther(data.amount),
        released: data.released,
        rejected: data.rejected, // V2: New rejected state
        yesPower: ethers.utils.formatEther(data.yesPower),
        noPower: ethers.utils.formatEther(data.noPower),
        voteStart: data.voteStart.toNumber(),
        voteEnd: data.voteEnd.toNumber()
      };
    } catch (error: any) {
      console.error('[Blockchain] Error getting milestone data:', error);
      throw new Error(`Failed to get milestone data: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Finalize milestone - V2: Auto-releases or auto-rejects based on voting results
   * @param milestoneIndex - Index in contract milestones array
   * @returns Transaction hash
   * 
   * Note: In V2, this triggers automatic release to creator if approved,
   * or marks as rejected if voting failed. No manual release needed!
   */
  async finalizeMilestone(milestoneIndex: number): Promise<string> {
    try {
      console.log(`[Blockchain] Finalizing milestone ${milestoneIndex} (V2: will auto-release or reject)`);
      
      const tx = await this.contract.finalize(milestoneIndex);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Milestone finalized, TX: ${receipt.transactionHash}`);
      console.log(`[Blockchain] ℹ️ Check milestone state for released=true or rejected=true`);
      
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error finalizing milestone:', error);
      throw new Error(`Failed to finalize milestone: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * V2: Admin emergency force release (only if auto-release failed)
   * @param milestoneIndex - Index in contract milestones array
   * @returns Transaction hash
   * 
   * WARNING: This is for emergency reconciliation only!
   * Normal flow uses auto-release in finalizeMilestone()
   */
  async adminForceRelease(milestoneIndex: number): Promise<string> {
    try {
      console.log(`[Blockchain] 🚨 EMERGENCY: Admin force releasing milestone ${milestoneIndex}`);
      
      const tx = await this.contract.adminForceRelease(milestoneIndex);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Admin force release complete, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error in admin force release:', error);
      throw new Error(`Failed to admin force release: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * V2: Admin manually reject milestone (opens for refunds)
   * @param milestoneIndex - Index in contract milestones array
   * @param reason - Reason for rejection
   * @returns Transaction hash
   */
  async adminRejectMilestone(milestoneIndex: number, reason: string): Promise<string> {
    try {
      console.log(`[Blockchain] Admin rejecting milestone ${milestoneIndex}: ${reason}`);
      
      const tx = await this.contract.adminRejectMilestone(milestoneIndex, reason);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Milestone rejected, backers can now claim refunds, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error rejecting milestone:', error);
      throw new Error(`Failed to reject milestone: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * V2: Backer claims refund for rejected milestone
   * @param milestoneIndex - Index in contract milestones array
   * @param backerPrivateKey - Backer's private key for signing
   * @returns Transaction hash
   */
  async claimRefund(milestoneIndex: number, backerPrivateKey: string): Promise<string> {
    try {
      const backerSigner = new ethers.Wallet(backerPrivateKey, this.provider);
      const contractWithBacker = this.contract.connect(backerSigner);
      
      console.log(`[Blockchain] Backer claiming refund for milestone ${milestoneIndex}`);
      
      const tx = await contractWithBacker.claimRefund(milestoneIndex);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Refund claimed, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error claiming refund:', error);
      throw new Error(`Failed to claim refund: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * V2: Get pending refunds for a backer
   * @param backerAddress - Backer's wallet address
   * @returns Array of milestone indices and refund amounts
   */
  async getPendingRefunds(backerAddress: string): Promise<{
    milestoneIndices: number[];
    refundAmounts: string[];
  }> {
    try {
      const result = await this.contract.getPendingRefunds(backerAddress);
      
      return {
        milestoneIndices: result[0].map((idx: ethers.BigNumber) => idx.toNumber()),
        refundAmounts: result[1].map((amt: ethers.BigNumber) => ethers.utils.formatEther(amt))
      };
    } catch (error: any) {
      console.error('[Blockchain] Error getting pending refunds:', error);
      throw new Error(`Failed to get pending refunds: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get user's total contribution (voting power)
   * @param userAddress - User's wallet address
   * @returns Contribution amount in ETH/POL
   */
  async getUserContribution(userAddress: string): Promise<string> {
    try {
      const contribution = await this.contract.contributions(userAddress);
      return ethers.utils.formatEther(contribution);
    } catch (error: any) {
      console.error('[Blockchain] Error getting user contribution:', error);
      throw new Error(`Failed to get user contribution: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get contract balance
   * @returns Balance in ETH/POL
   */
  async getContractBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(CONTRACT_ADDRESS);
      return ethers.utils.formatEther(balance);
    } catch (error: any) {
      console.error('[Blockchain] Error getting contract balance:', error);
      throw new Error(`Failed to get contract balance: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get total number of milestones in contract
   * @returns Number of milestones
   */
  async getMilestoneCount(): Promise<number> {
    try {
      const count = await this.contract.getMilestoneCount();
      return count.toNumber();
    } catch (error: any) {
      console.error('[Blockchain] Error getting milestone count:', error);
      throw new Error(`Failed to get milestone count: ${error?.message || 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();
