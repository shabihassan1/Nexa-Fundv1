import { PrismaClient, MilestoneStatus, EscrowTransactionType, TransactionStatus, CampaignStatus } from '../generated/prisma';

const prisma = new PrismaClient();

// Simple logging function
const safeLog = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data || '');
};

export interface CreateMilestoneData {
  title: string;
  description: string;
  amount: number;
  deadline: Date;
  order: number;
  proofRequirements?: string;
}

export interface SubmitMilestoneData {
  evidence: any;
  description: string;
}

export interface VoteMilestoneData {
  isApproval: boolean;
  comment?: string;
}

export class MilestoneService {
  // Create milestones for a campaign
  static async createMilestones(campaignId: string, milestonesData: CreateMilestoneData[]) {
    try {
      // Validate that total milestone amounts don't exceed target amount
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { milestones: true }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // VALIDATION RULE 1: Minimum 3 milestones required
      if (milestonesData.length < 3) {
        throw new Error('Minimum 3 milestones are required');
      }

      // VALIDATION RULE 2: First milestone cannot exceed 25% of target
      if (milestonesData[0] && milestonesData[0].amount > (campaign.targetAmount * 0.25)) {
        throw new Error('First milestone cannot exceed 25% of project goal');
      }

      // VALIDATION RULE 3: Second milestone cannot exceed 50% of target
      if (milestonesData[1] && milestonesData[1].amount > (campaign.targetAmount * 0.50)) {
        throw new Error('Second milestone cannot exceed 50% of project goal');
      }

      // VALIDATION RULE 4: Total milestone amounts must equal target amount
      const totalMilestoneAmount = milestonesData.reduce((sum, m) => sum + m.amount, 0);
      const difference = Math.abs(totalMilestoneAmount - campaign.targetAmount);
      if (difference > 0.01) { // Allow 1 cent tolerance for rounding
        if (totalMilestoneAmount > campaign.targetAmount) {
          throw new Error('Total milestone amounts cannot exceed campaign target amount');
        } else {
          throw new Error('Total milestone amounts must equal campaign target amount');
        }
      }

      // Create milestones in a transaction
      const milestones = await prisma.$transaction(async (tx) => {
        const createdMilestones = [];
        for (let i = 0; i < milestonesData.length; i++) {
          const milestoneData = milestonesData[i];
          const milestone = await tx.milestone.create({
            data: {
              ...milestoneData,
              campaignId,
              // First milestone (order: 1) starts as ACTIVE to accept contributions
              status: milestoneData.order === 1 ? MilestoneStatus.ACTIVE : MilestoneStatus.PENDING
            }
          });
          createdMilestones.push(milestone);
        }

        // Update campaign to require milestones if target amount >= 500
        if (campaign.targetAmount >= 500) {
          await tx.campaign.update({
            where: { id: campaignId },
            data: { requiresMilestones: true }
          });
        }

        return createdMilestones;
      });

      safeLog('Milestones created successfully', { campaignId, count: milestones.length });
      return milestones;
    } catch (error: any) {
      safeLog('Error creating milestones', { error: error?.message });
      throw error;
    }
  }

  // Validate milestone requirements
  static async validateMilestoneRequirements(campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { milestones: true }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const errors = [];

    // Check if milestones are required (>= $500)
    if (campaign.targetAmount >= 500) {
      if (campaign.milestones.length < 3) {
        errors.push('Campaigns with target amount >= $500 must have at least 3 milestones');
      }
    }

    // Check milestone order and amounts
    const sortedMilestones = campaign.milestones.sort((a, b) => a.order - b.order);
    let totalAmount = 0;

    for (let i = 0; i < sortedMilestones.length; i++) {
      const milestone = sortedMilestones[i];
      if (milestone.order !== i + 1) {
        errors.push(`Milestone order must be sequential starting from 1`);
      }
      totalAmount += milestone.amount;
    }

    if (totalAmount > campaign.targetAmount) {
      errors.push('Total milestone amounts cannot exceed campaign target amount');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Submit milestone for review
  static async submitMilestone(milestoneId: string, userId: string, submissionData: SubmitMilestoneData) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: true }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.campaign.creatorId !== userId) {
        throw new Error('Only campaign creator can submit milestones');
      }

      // Allow submission for PENDING or ACTIVE milestones (active means it's been funded)
      if (milestone.status !== MilestoneStatus.PENDING && milestone.status !== MilestoneStatus.ACTIVE) {
        throw new Error(`Milestone must be PENDING or ACTIVE to submit proof. Current status: ${milestone.status}`);
      }

      // Create submission and update milestone
      const result = await prisma.$transaction(async (tx) => {
        // Create submission record
        const submission = await tx.milestoneSubmission.create({
          data: {
            milestoneId,
            evidence: submissionData.evidence,
            description: submissionData.description
          }
        });

        // Update milestone status to VOTING (skip SUBMITTED state for automatic flow)
        const now = new Date();
        const voteEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: MilestoneStatus.VOTING,
            submittedAt: now,
            evidence: submissionData.evidence,
            voteStartTime: now,
            voteEndTime: voteEndTime,
            votingDeadline: voteEndTime
          }
        });

        return { submission, milestone: updatedMilestone };
      });

      safeLog('Milestone submitted and voting opened automatically', { 
        milestoneId, 
        userId,
        status: 'VOTING',
        votingDeadline: result.milestone.votingDeadline 
      });
      
      return result;
    } catch (error: any) {
      safeLog('Error submitting milestone', { error: error?.message });
      throw error;
    }
  }

  // Start voting period for milestone
  static async startVoting(milestoneId: string) {
    try {
      const milestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.VOTING,
          votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      safeLog('Voting started for milestone', { milestoneId });
      return milestone;
    } catch (error: any) {
      safeLog('Error starting voting', { error: error?.message });
      throw error;
    }
  }

  // Vote on milestone
  static async voteOnMilestone(milestoneId: string, userId: string, voteData: VoteMilestoneData) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: { include: { contributions: true } } }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.status !== MilestoneStatus.VOTING) {
        throw new Error('Milestone is not in voting status');
      }

      // Check if voting period has ended
      if (milestone.votingDeadline && new Date() > milestone.votingDeadline) {
        throw new Error('Voting period has ended');
      }

      // Check if user has contributed to the campaign
      const userContribution = milestone.campaign.contributions.find(c => c.userId === userId);
      if (!userContribution) {
        throw new Error('Only campaign backers can vote on milestones');
      }

      // Calculate voting power based on contribution amount
      const votingPower = Math.min(userContribution.amount / 50, 5); // Max 5x voting power

      const result = await prisma.$transaction(async (tx) => {
        // Check if user already voted
        const existingVote = await tx.vote.findUnique({
          where: {
            userId_milestoneId: {
              userId,
              milestoneId
            }
          }
        });

        if (existingVote) {
          throw new Error('User has already voted on this milestone');
        }

        // Create vote
        const vote = await tx.vote.create({
          data: {
            userId,
            milestoneId,
            isApproval: voteData.isApproval,
            comment: voteData.comment,
            votingPower
          }
        });

        // Update milestone vote counts
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            votesFor: voteData.isApproval ? 
              { increment: Math.floor(votingPower) } : undefined,
            votesAgainst: !voteData.isApproval ? 
              { increment: Math.floor(votingPower) } : undefined
          }
        });

        return { vote, milestone: updatedMilestone };
      });

      // Check if milestone should be automatically approved/rejected
      await this.checkMilestoneVotingResult(milestoneId);

      safeLog('Vote cast successfully', { milestoneId, userId, isApproval: voteData.isApproval });
      return result;
    } catch (error: any) {
      safeLog('Error voting on milestone', { error: error?.message });
      throw error;
    }
  }

  // Check voting result and auto-approve/reject
  static async checkMilestoneVotingResult(milestoneId: string) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: { include: { contributions: true } } }
      });

      if (!milestone || milestone.status !== MilestoneStatus.VOTING) {
        return;
      }

      const totalVotes = milestone.votesFor + milestone.votesAgainst;
      const approvalRate = totalVotes > 0 ? (milestone.votesFor / totalVotes) * 100 : 0;

      // Auto-approve if 60% approval and significant votes
      if (approvalRate >= 60 && totalVotes >= 3) {
        await this.approveMilestone(milestoneId, 'AUTO_APPROVED');
      }
      // Auto-reject if below 40% and voting period ended
      else if (approvalRate < 40 && milestone.votingDeadline && new Date() > milestone.votingDeadline) {
        await this.rejectMilestone(milestoneId, 'AUTO_REJECTED', 'Insufficient community approval');
      }
    } catch (error: any) {
      safeLog('Error checking voting result', { error: error?.message });
    }
  }

  // Approve milestone and release funds
  static async approveMilestone(milestoneId: string, executedBy: string) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: true }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update milestone status
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: MilestoneStatus.APPROVED,
            approvedAt: new Date()
          }
        });

        // Create escrow transaction for fund release
        const escrowTransaction = await tx.escrowTransaction.create({
          data: {
            campaignId: milestone.campaignId,
            milestoneId,
            amount: milestone.amount,
            type: EscrowTransactionType.RELEASE,
            description: `Funds released for milestone: ${milestone.title}`,
            status: TransactionStatus.CONFIRMED,
            executedBy,
            executedAt: new Date()
          }
        });

        // Update campaign escrow and released amounts
        await tx.campaign.update({
          where: { id: milestone.campaignId },
          data: {
            escrowAmount: { decrement: milestone.amount },
            releasedAmount: { increment: milestone.amount }
          }
        });

        return { milestone: updatedMilestone, escrowTransaction };
      });

      safeLog('Milestone approved and funds released', { milestoneId });
      return result;
    } catch (error: any) {
      safeLog('Error approving milestone', { error: error?.message });
      throw error;
    }
  }

  // Reject milestone
  static async rejectMilestone(milestoneId: string, executedBy: string, reason: string) {
    try {
      const milestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.REJECTED,
          rejectedAt: new Date(),
          adminNotes: reason
        }
      });

      safeLog('Milestone rejected', { milestoneId, reason });
      return milestone;
    } catch (error: any) {
      safeLog('Error rejecting milestone', { error: error?.message });
      throw error;
    }
  }

  // Process contribution to escrow
  static async processContributionToEscrow(contributionId: string) {
    try {
      const contribution = await prisma.contribution.findUnique({
        where: { id: contributionId },
        include: { campaign: true }
      });

      if (!contribution) {
        throw new Error('Contribution not found');
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create escrow deposit transaction
        const escrowTransaction = await tx.escrowTransaction.create({
          data: {
            campaignId: contribution.campaignId,
            amount: contribution.amount,
            type: EscrowTransactionType.DEPOSIT,
            description: `Contribution deposited to escrow`,
            status: TransactionStatus.CONFIRMED,
            executedAt: new Date()
          }
        });

        // Update campaign escrow amount
        await tx.campaign.update({
          where: { id: contribution.campaignId },
          data: {
            escrowAmount: { increment: contribution.amount }
          }
        });

        return escrowTransaction;
      });

      safeLog('Contribution processed to escrow', { contributionId });
      return result;
    } catch (error: any) {
      safeLog('Error processing contribution to escrow', { error: error?.message });
      throw error;
    }
  }

  // Get milestone statistics
  static async getMilestoneStats(campaignId: string) {
    try {
      const milestones = await prisma.milestone.findMany({
        where: { campaignId },
        include: { votes: true }
      });

      const stats = {
        total: milestones.length,
        pending: milestones.filter(m => m.status === MilestoneStatus.PENDING).length,
        voting: milestones.filter(m => m.status === MilestoneStatus.VOTING).length,
        approved: milestones.filter(m => m.status === MilestoneStatus.APPROVED).length,
        rejected: milestones.filter(m => m.status === MilestoneStatus.REJECTED).length,
        totalApprovedAmount: milestones
          .filter(m => m.status === MilestoneStatus.APPROVED)
          .reduce((sum, m) => sum + m.amount, 0)
      };

      return stats;
    } catch (error: any) {
      safeLog('Error getting milestone stats', { error: error?.message });
      throw error;
    }
  }

  // Check and update expired milestones
  static async checkExpiredMilestones() {
    try {
      const now = new Date();
      
      // Find milestones that have passed their deadline
      const expiredMilestones = await prisma.milestone.findMany({
        where: {
          status: MilestoneStatus.PENDING,
          deadline: { lt: now }
        }
      });

      // Update expired milestones
      for (const milestone of expiredMilestones) {
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: MilestoneStatus.EXPIRED,
            adminNotes: 'Milestone expired - deadline passed without submission'
          }
        });
      }

      // Find voting periods that have ended
      const endedVotingMilestones = await prisma.milestone.findMany({
        where: {
          status: MilestoneStatus.VOTING,
          votingDeadline: { lt: now }
        }
      });

      // Process ended voting periods
      for (const milestone of endedVotingMilestones) {
        await this.checkMilestoneVotingResult(milestone.id);
      }

      safeLog('Expired milestones checked', { 
        expired: expiredMilestones.length, 
        endedVoting: endedVotingMilestones.length 
      });

      return {
        expiredMilestones: expiredMilestones.length,
        endedVotingMilestones: endedVotingMilestones.length
      };
    } catch (error: any) {
      safeLog('Error checking expired milestones', { error: error?.message });
      throw error;
    }
  }

  // ==================== NEW: MILESTONE VOTING & RELEASE SYSTEM ====================

  /**
   * Get available milestone for contributions (intelligent availability logic)
   * 
   * A milestone is available for contributions when:
   * 1. First milestone (order = 1) → Always available if not fully funded
   * 2. Subsequent milestones → Available if previous milestone is APPROVED and current not fully funded
   * 
   * This ensures:
   * - First milestone starts accepting contributions immediately at $0
   * - Next milestone only unlocks after previous is fully funded AND approved
   * - No contributions accepted if milestone is fully funded (waiting for proof/voting)
   */
  static async getActiveMilestone(campaignId: string) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          milestones: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.milestones.length === 0) {
        return null;
      }

      // Find the milestone that is currently available for contributions
      for (const milestone of campaign.milestones) {
        const currentAmount = parseFloat(milestone.currentAmount.toString());
        const targetAmount = parseFloat(milestone.amount.toString());
        
        // Check if this milestone is fully funded
        const isFullyFunded = currentAmount >= targetAmount;
        
        // First milestone: Available if not fully funded
        if (milestone.order === 1) {
          if (!isFullyFunded) {
            return milestone;
          }
          // If first milestone is fully funded, continue to check next
          continue;
        }
        
        // For subsequent milestones: Check if previous milestone is approved
        const previousMilestone = campaign.milestones.find(m => m.order === milestone.order - 1);
        
        if (!previousMilestone) {
          continue; // Should not happen, but safety check
        }
        
        const prevCurrentAmount = parseFloat(previousMilestone.currentAmount.toString());
        const prevTargetAmount = parseFloat(previousMilestone.amount.toString());
        const isPreviousFullyFunded = prevCurrentAmount >= prevTargetAmount;
        const isPreviousApproved = previousMilestone.status === MilestoneStatus.APPROVED;
        
        // This milestone is available if:
        // - Previous milestone is fully funded AND approved
        // - Current milestone is not fully funded yet
        if (isPreviousFullyFunded && isPreviousApproved && !isFullyFunded) {
          return milestone;
        }
        
        // If we found a milestone that's not ready yet, stop checking
        // (milestones must be completed sequentially)
        if (!isPreviousApproved || !isFullyFunded) {
          break;
        }
      }

      // No milestone is currently available for contributions
      return null;
    } catch (error: any) {
      safeLog('Error getting active milestone', { error: error?.message });
      throw error;
    }
  }

  /**
   * Submit milestone for voting - Creator submits proof and opens voting
   */
  static async submitMilestoneForVoting(
    milestoneId: string,
    userId: string,
    evidence: {
      description: string;
      files: string[];
      links: string[];
    }
  ) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: true }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.campaign.creatorId !== userId) {
        throw new Error('Only campaign creator can submit milestones');
      }

      if (milestone.status !== MilestoneStatus.ACTIVE && milestone.status !== MilestoneStatus.PENDING) {
        throw new Error(`Cannot submit milestone with status: ${milestone.status}`);
      }

      // Update milestone with evidence and set to VOTING (skip SUBMITTED state)
      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.VOTING,
          submittedAt: new Date(),
          evidence: evidence,
          votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      safeLog('Milestone submitted for voting', { milestoneId, userId });

      // Auto-open voting after submission (in production, admin would approve first)
      // For now, we'll auto-open after 1 second delay
      setTimeout(async () => {
        try {
          await this.openVotingForMilestone(milestoneId);
        } catch (error: any) {
          safeLog('Error auto-opening voting', { error: error?.message });
        }
      }, 1000);

      return updatedMilestone;
    } catch (error: any) {
      safeLog('Error submitting milestone for voting', { error: error?.message });
      throw error;
    }
  }

  /**
   * Open voting for a milestone - Updates DB and calls smart contract
   */
  static async openVotingForMilestone(milestoneId: string) {
    try {
      const { blockchainService } = await import('./blockchainService');
      
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: true }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Allow opening voting if milestone is PENDING or VOTING (in case already open)
      if (milestone.status !== MilestoneStatus.PENDING && milestone.status !== MilestoneStatus.VOTING) {
        throw new Error(`Cannot open voting for milestone with status: ${milestone.status}`);
      }

      // Set voting window (7 days)
      const voteStartTime = new Date();
      const voteEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Update database first
      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.VOTING,
          voteStartTime,
          voteEndTime,
          votingDeadline: voteEndTime
        }
      });

      // Open voting on blockchain
      try {
        const milestoneIndex = milestone.blockchainMilestoneIndex !== null 
          ? milestone.blockchainMilestoneIndex 
          : milestone.order - 1;
        
        const txHash = await blockchainService.openVoting(milestoneIndex, 7);

        // Update with blockchain data
        await prisma.milestone.update({
          where: { id: milestoneId },
          data: {
            blockchainMilestoneIndex: milestoneIndex,
            evidence: {
              ...(milestone.evidence as any),
              votingOpenedTxHash: txHash
            }
          }
        });

        safeLog('Voting opened successfully', { milestoneId, txHash });
      } catch (blockchainError: any) {
        safeLog('Blockchain voting open failed (continuing with DB only)', { 
          error: blockchainError?.message 
        });
      }

      return updatedMilestone;
    } catch (error: any) {
      safeLog('Error opening voting for milestone', { error: error?.message });
      throw error;
    }
  }

  /**
   * Cast vote on milestone with weighted voting power
   */
  static async voteOnMilestoneWeighted(
    milestoneId: string,
    userId: string,
    isApproval: boolean,
    comment?: string,
    voterPrivateKey?: string
  ) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { 
          campaign: { 
            include: { contributions: { where: { userId } } } 
          } 
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.status !== MilestoneStatus.VOTING) {
        throw new Error('Milestone is not in voting status');
      }

      // Check if voting period is active
      const now = new Date();
      if (milestone.voteStartTime && now < milestone.voteStartTime) {
        throw new Error('Voting has not started yet');
      }
      if (milestone.voteEndTime && now > milestone.voteEndTime) {
        throw new Error('Voting period has ended');
      }

      // Check if user has contributed
      const userContributions = milestone.campaign.contributions;
      if (userContributions.length === 0) {
        throw new Error('Only campaign backers can vote');
      }

      // Calculate voting power = total contribution amount
      const votingPower = userContributions.reduce((sum, c) => sum + c.amount, 0);

      // Create vote in database
      const result = await prisma.$transaction(async (tx) => {
        // Check for existing vote
        const existingVote = await tx.vote.findUnique({
          where: {
            userId_milestoneId: {
              userId,
              milestoneId
            }
          }
        });

        if (existingVote) {
          throw new Error('You have already voted on this milestone');
        }

        // Create vote record
        const vote = await tx.vote.create({
          data: {
            userId,
            milestoneId,
            isApproval,
            comment,
            votingPower
          }
        });

        // Update milestone vote counts
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            votesFor: isApproval ? { increment: 1 } : undefined,
            votesAgainst: !isApproval ? { increment: 1 } : undefined
          }
        });

        return { vote, milestone: updatedMilestone };
      });

      // Record vote on blockchain (if private key provided)
      if (voterPrivateKey) {
        try {
          const { blockchainService } = await import('./blockchainService');
          const milestoneIndex = milestone.blockchainMilestoneIndex ?? milestone.order - 1;
          
          const txHash = await blockchainService.voteMilestone(
            milestoneIndex,
            isApproval,
            voterPrivateKey
          );

          safeLog('Vote recorded on blockchain', { milestoneId, txHash });
        } catch (blockchainError: any) {
          safeLog('Blockchain vote failed (continuing with DB only)', { 
            error: blockchainError?.message 
          });
        }
      }

      // Check if release conditions are met
      await this.checkAndReleaseMilestone(milestoneId);

      safeLog('Vote cast successfully', { 
        milestoneId, 
        userId, 
        isApproval, 
        votingPower 
      });

      return result;
    } catch (error: any) {
      safeLog('Error voting on milestone', { error: error?.message });
      throw error;
    }
  }

  /**
   * Check if milestone meets release conditions and release if yes
   */
  static async checkAndReleaseMilestone(milestoneId: string): Promise<{
    released: boolean;
    rejected: boolean;
    transactionHash?: string;
    approvalPercentage: number;
    quorumPercentage: number;
    yesVotes: number;
    noVotes: number;
    error?: string;
  }> {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { 
          campaign: { 
            include: { 
              contributions: true
            } 
          },
          votes: true
        }
      });

      if (!milestone || milestone.status !== MilestoneStatus.VOTING) {
        return {
          released: false,
          rejected: false,
          approvalPercentage: 0,
          quorumPercentage: 0,
          yesVotes: 0,
          noVotes: 0
        };
      }

      // Calculate voting statistics from database
      const totalVotingPower = milestone.votes.reduce((sum, v) => sum + v.votingPower, 0);
      const yesVotingPower = milestone.votes
        .filter(v => v.isApproval)
        .reduce((sum, v) => sum + v.votingPower, 0);
      const noVotingPower = totalVotingPower - yesVotingPower;
      
      const goal = milestone.campaign?.targetAmount || 0;
      const approvalPercentage = totalVotingPower > 0 ? (yesVotingPower / totalVotingPower) * 100 : 0;
      const quorumPercentage = goal > 0 ? (totalVotingPower / goal) * 100 : 0;
      
      const quorumReached = quorumPercentage >= 10; // 10% of campaign goal
      const approvalReached = approvalPercentage >= 60; // 60% of votes

      safeLog('Checking release conditions (DB)', {
        milestoneId,
        yesVotingPower,
        noVotingPower,
        totalVotingPower,
        goal,
        quorumReached,
        approvalReached,
        approvalPercentage: approvalPercentage.toFixed(1),
        quorumPercentage: quorumPercentage.toFixed(1)
      });

      // Check if conditions are met
      if (quorumReached && approvalReached) {
        // CRITICAL: Try blockchain finalization with retry logic
        let txHash: string | undefined;
        let blockchainReleased = false;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { blockchainService } = await import('./blockchainService');
            const milestoneIndex = milestone.blockchainMilestoneIndex ?? milestone.order - 1;
            
            safeLog(`Attempting blockchain fund release (attempt ${attempt}/${maxRetries})`, { milestoneId });
            txHash = await blockchainService.finalizeMilestone(milestoneIndex);
            blockchainReleased = true;
            safeLog('✅ Funds released on blockchain!', { milestoneId, txHash });
            break;
          } catch (blockchainError: any) {
            safeLog(`❌ Blockchain release attempt ${attempt} failed`, { 
              error: blockchainError?.message,
              milestoneId 
            });
            
            // If this is the last attempt, fail the approval
            if (attempt === maxRetries) {
              safeLog('🚨 CRITICAL: All blockchain release attempts failed - milestone approval blocked', {
                milestoneId,
                error: blockchainError?.message
              });
              
              // Mark milestone as needing manual intervention
              await prisma.milestone.update({
                where: { id: milestoneId },
                data: {
                  adminNotes: `REQUIRES MANUAL RELEASE: Blockchain finalization failed after ${maxRetries} attempts. Error: ${blockchainError?.message}`
                }
              });
              
              // Return without approving - funds stay in escrow
              return {
                released: false,
                rejected: false,
                approvalPercentage,
                quorumPercentage,
                yesVotes: yesVotingPower,
                noVotes: noVotingPower,
                error: 'Blockchain release failed - requires manual admin intervention'
              };
            }
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          }
        }

        // Only update database if blockchain release succeeded
        if (blockchainReleased) {
          // Update milestone to APPROVED
          await prisma.milestone.update({
            where: { id: milestoneId },
            data: {
              status: MilestoneStatus.APPROVED,
              approvedAt: new Date(),
              releaseTransactionHash: txHash
            }
          });

          // Update campaign amounts (now in sync with blockchain)
          await prisma.campaign.update({
            where: { id: milestone.campaignId },
            data: {
              escrowAmount: { decrement: milestone.amount },
              releasedAmount: { increment: milestone.amount }
            }
          });
        }

        // Set next milestone to ACTIVE or mark campaign as COMPLETED
        const nextMilestone = await prisma.milestone.findFirst({
          where: {
            campaignId: milestone.campaignId,
            order: milestone.order + 1
          }
        });

        if (nextMilestone && nextMilestone.status === MilestoneStatus.PENDING) {
          await prisma.milestone.update({
            where: { id: nextMilestone.id },
            data: { status: MilestoneStatus.ACTIVE }
          });
          safeLog('Next milestone activated', { nextMilestoneId: nextMilestone.id, order: nextMilestone.order });
        } else {
          // No next milestone - this was the last one, mark campaign as COMPLETED
          const allMilestones = await prisma.milestone.findMany({
            where: { campaignId: milestone.campaignId },
            orderBy: { order: 'asc' }
          });
          
          const isLastMilestone = milestone.order === allMilestones.length;
          
          if (isLastMilestone) {
            await prisma.campaign.update({
              where: { id: milestone.campaignId },
              data: { status: CampaignStatus.COMPLETED }
            });
            safeLog('🎉 Campaign marked as COMPLETED - all milestones approved!', { campaignId: milestone.campaignId });
          }
        }

        safeLog('✅ Milestone approved and funds released', { milestoneId, txHash });
        return {
          released: true,
          rejected: false,
          transactionHash: txHash,
          approvalPercentage,
          quorumPercentage,
          yesVotes: yesVotingPower,
          noVotes: noVotingPower
        };
      }

      // Check if voting period has ended without meeting conditions
      if (milestone.voteEndTime && new Date() > milestone.voteEndTime) {
        // Mark as rejected
        await prisma.milestone.update({
          where: { id: milestoneId },
          data: {
            status: MilestoneStatus.REJECTED,
            rejectedAt: new Date(),
            adminNotes: `Did not meet release conditions: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 10%)`
          }
        });

        safeLog('❌ Milestone rejected (voting ended, conditions not met)', { milestoneId });
        return {
          released: false,
          rejected: true,
          approvalPercentage,
          quorumPercentage,
          yesVotes: yesVotingPower,
          noVotes: noVotingPower
        };
      }

      // Voting still active, conditions not yet met
      return {
        released: false,
        rejected: false,
        approvalPercentage,
        quorumPercentage,
        yesVotes: yesVotingPower,
        noVotes: noVotingPower
      };
    } catch (error: any) {
      safeLog('Error checking and releasing milestone', { error: error?.message });
      return {
        released: false,
        rejected: false,
        approvalPercentage: 0,
        quorumPercentage: 0,
        yesVotes: 0,
        noVotes: 0
      };
    }
  }

  /**
   * Get milestone voting statistics
   */
  static async getMilestoneVotingStats(milestoneId: string, userId?: string) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          votes: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  walletAddress: true
                }
              }
            }
          },
          campaign: {
            select: {
              id: true,
              targetAmount: true,
              contributions: true
            }
          }
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      const totalVotes = milestone.votesFor + milestone.votesAgainst;
      const approvalPercentage = totalVotes > 0 
        ? (milestone.votesFor / totalVotes) * 100 
        : 0;

      // Calculate total voting power
      const totalVotingPower = milestone.votes.reduce((sum, v) => sum + v.votingPower, 0);
      const yesVotingPower = milestone.votes
        .filter(v => v.isApproval)
        .reduce((sum, v) => sum + v.votingPower, 0);
      const noVotingPower = milestone.votes
        .filter(v => !v.isApproval)
        .reduce((sum, v) => sum + v.votingPower, 0);

      const quorumPercentage = (totalVotingPower / milestone.campaign.targetAmount) * 100;
      const quorumReached = quorumPercentage >= 10;

      // User-specific data (only if userId provided)
      let userVotingPower = 0;
      let userHasVoted = false;

      if (userId) {
        // Check if user has voted
        const userVote = milestone.votes.find(v => v.userId === userId);
        userHasVoted = !!userVote;

        // Calculate user's voting power based on contributions
        const userContributions = milestone.campaign.contributions
          .filter((c: any) => c.userId === userId)
          .reduce((sum: number, c: any) => sum + c.amount, 0);
        
        userVotingPower = userContributions;
      }

      const stats = {
        milestoneId: milestone.id,
        status: milestone.status,
        totalVotes,
        votesFor: milestone.votesFor,
        votesAgainst: milestone.votesAgainst,
        approvalPercentage,
        quorumReached,
        quorumPercentage,
        votingPower: {
          total: totalVotingPower,
          yes: yesVotingPower,
          no: noVotingPower
        },
        voters: milestone.votes.map(v => ({
          userId: v.user.id,
          userName: v.user.name,
          vote: v.isApproval,
          power: v.votingPower,
          comment: v.comment,
          votedAt: v.createdAt
        })),
        voteStartTime: milestone.voteStartTime,
        voteEndTime: milestone.voteEndTime,
        timeRemaining: milestone.voteEndTime 
          ? Math.max(0, milestone.voteEndTime.getTime() - Date.now())
          : 0,
        // User-specific fields
        userVotingPower,
        userHasVoted
      };

      return stats;
    } catch (error: any) {
      safeLog('Error getting voting stats', { error: error?.message });
      throw error;
    }
  }

  /**
   * Admin force release - emergency override when blockchain fails
   */
  static async adminForceRelease(milestoneId: string) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { 
          campaign: true,
          votes: true 
        }
      });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Verify milestone is in a state that requires manual release
      if (milestone.status === MilestoneStatus.APPROVED) {
        throw new Error('Milestone already approved and released');
      }

      if (milestone.status !== MilestoneStatus.VOTING) {
        throw new Error('Milestone must be in VOTING status to force release');
      }

      // Verify voting conditions are met
      const totalVotingPower = milestone.votes.reduce((sum, v) => sum + v.votingPower, 0);
      const yesVotingPower = milestone.votes
        .filter(v => v.isApproval)
        .reduce((sum, v) => sum + v.votingPower, 0);
      
      const goal = milestone.campaign.targetAmount;
      const approvalPercentage = totalVotingPower > 0 ? (yesVotingPower / totalVotingPower) * 100 : 0;
      const quorumPercentage = (totalVotingPower / goal) * 100;

      if (approvalPercentage < 60 || quorumPercentage < 10) {
        throw new Error(`Conditions not met: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 10%)`);
      }

      safeLog('🔧 Admin forcing blockchain release (V2: Emergency Force Release)', { milestoneId });

      // V2: Force blockchain release with admin override (emergency only)
      let txHash: string | undefined;
      try {
        const { blockchainService } = await import('./blockchainService');
        const milestoneIndex = milestone.blockchainMilestoneIndex ?? milestone.order - 1;
        txHash = await blockchainService.adminForceRelease(milestoneIndex);
        safeLog('✅ Admin force release successful (V2)', { milestoneId, txHash });
      } catch (blockchainError: any) {
        throw new Error(`Blockchain admin force release failed: ${blockchainError?.message}`);
      }

      // Update database only after successful blockchain release
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.APPROVED,
          approvedAt: new Date(),
          releaseTransactionHash: txHash,
          adminNotes: 'Released by admin override after voting conditions met'
        }
      });

      await prisma.campaign.update({
        where: { id: milestone.campaignId },
        data: {
          escrowAmount: { decrement: milestone.amount },
          releasedAmount: { increment: milestone.amount }
        }
      });

      // Activate next milestone if exists
      const nextMilestone = await prisma.milestone.findFirst({
        where: {
          campaignId: milestone.campaignId,
          order: milestone.order + 1
        }
      });

      if (nextMilestone) {
        await prisma.milestone.update({
          where: { id: nextMilestone.id },
          data: { status: MilestoneStatus.ACTIVE }
        });
      }

      return {
        success: true,
        transactionHash: txHash,
        message: 'Funds released successfully via admin override'
      };
    } catch (error: any) {
      safeLog('Error in admin force release', { error: error?.message });
      throw error;
    }
  }
}

export default MilestoneService; 