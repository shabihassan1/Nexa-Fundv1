import { ethers } from 'ethers';
import NexaFundWeightedArtifact from '../abi/NexaFundWeighted.json';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x2428fB67608E04Dc3171f05e212211BBB633f589';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || '';
const RPC_URL = process.env.TENDERLY_RPC_URL || 'https://virtual.mainnet.rpc.tenderly.co/73571';

export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private adminSigner: ethers.Wallet;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    this.adminSigner = new ethers.Wallet(ADMIN_PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      NexaFundWeightedArtifact.abi,
      this.adminSigner
    );
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
   * Get milestone data from smart contract
   * @param milestoneIndex - Index in contract milestones array
   * @returns Milestone data including vote results
   */
  async getMilestoneData(milestoneIndex: number): Promise<{
    description: string;
    amount: string;
    released: boolean;
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
   * Finalize milestone - triggers auto-release if conditions met
   * @param milestoneIndex - Index in contract milestones array
   * @returns Transaction hash
   */
  async finalizeMilestone(milestoneIndex: number): Promise<string> {
    try {
      console.log(`[Blockchain] Finalizing milestone ${milestoneIndex}`);
      
      const tx = await this.contract.finalize(milestoneIndex);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Milestone finalized, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error finalizing milestone:', error);
      
      // Check if error is due to conditions not met
      if (error?.message?.includes('Quorum not reached') || 
          error?.message?.includes('Not enough approval')) {
        console.log('[Blockchain] Milestone did not meet release conditions');
        throw new Error('MILESTONE_REJECTED');
      }
      
      throw new Error(`Failed to finalize milestone: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Admin override to release milestone funds
   * @param milestoneIndex - Index in contract milestones array
   * @returns Transaction hash
   */
  async adminRelease(milestoneIndex: number): Promise<string> {
    try {
      console.log(`[Blockchain] Admin releasing milestone ${milestoneIndex}`);
      
      const tx = await this.contract.adminRelease(milestoneIndex);
      const receipt = await tx.wait();
      
      console.log(`[Blockchain] Admin release complete, TX: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('[Blockchain] Error in admin release:', error);
      throw new Error(`Failed to admin release: ${error?.message || 'Unknown error'}`);
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
