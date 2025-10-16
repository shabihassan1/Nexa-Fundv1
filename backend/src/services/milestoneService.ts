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

      // FIX: Voting power = actual contribution amount (not divided by 50)
      const votingPower = userContribution.amount;

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

        // FIX: Store voting power amounts instead of counts
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            votesFor: voteData.isApproval ? 
              { increment: votingPower } : undefined,
            votesAgainst: !voteData.isApproval ? 
              { increment: votingPower } : undefined
          }
        });

        return { vote, milestone: updatedMilestone };
      });

      // Check if milestone should be automatically approved/rejected
      // AND check if all contributors have voted (early finalization)
      await this.checkMilestoneVotingResult(milestoneId);

      safeLog('Vote cast successfully', { milestoneId, userId, isApproval: voteData.isApproval });
      return result;
    } catch (error: any) {
      safeLog('Error voting on milestone', { error: error?.message });
      throw error;
    }
  }

  // Check voting result and auto-approve/reject
  // FIX: Use voting power from votes table, check against milestone amount, allow early finalization
  static async checkMilestoneVotingResult(milestoneId: string) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: { 
          campaign: { include: { contributions: true } },
          votes: true
        }
      });

      if (!milestone || milestone.status !== MilestoneStatus.VOTING) {
        return;
      }

      // Calculate voting statistics using actual voting power
      const totalVotingPower = milestone.votes.reduce((sum, v) => sum + v.votingPower, 0);
      const yesVotingPower = milestone.votes
        .filter(v => v.isApproval)
        .reduce((sum, v) => sum + v.votingPower, 0);
      const noVotingPower = totalVotingPower - yesVotingPower;
      
      // FIX: Quorum based on milestone amount, not campaign goal
      const milestoneAmount = milestone.amount;
      const approvalPercentage = totalVotingPower > 0 ? (yesVotingPower / totalVotingPower) * 100 : 0;
      const quorumPercentage = milestoneAmount > 0 ? (totalVotingPower / milestoneAmount) * 100 : 0;
      
      const quorumReached = quorumPercentage >= 60; // 60% of milestone amount must vote
      const approvalReached = approvalPercentage >= 60; // 60% of votes must be YES

      // Check if all contributors have voted (early finalization)
      const uniqueContributors = new Set(milestone.campaign.contributions.map(c => c.userId)).size;
      const uniqueVoters = milestone.votes.length;
      const allContributorsVoted = uniqueVoters >= uniqueContributors;

      // Check if voting period has ended
      const votingPeriodEnded = milestone.voteEndTime && new Date() > milestone.voteEndTime;

      safeLog('Checking voting result', {
        milestoneId,
        yesVotingPower,
        noVotingPower,
        totalVotingPower,
        milestoneAmount,
        approvalPercentage: approvalPercentage.toFixed(1),
        quorumPercentage: quorumPercentage.toFixed(1),
        quorumReached,
        approvalReached,
        allContributorsVoted,
        votingPeriodEnded
      });

      // FIX: Finalize if conditions met OR all contributors voted OR voting period ended
      if (quorumReached && approvalReached) {
        // Conditions met - trigger blockchain release
        await this.checkAndReleaseMilestone(milestoneId);
        safeLog('✅ Milestone approved - conditions met', { milestoneId });
      } else if (allContributorsVoted) {
        // All contributors voted - finalize even if time hasn't ended
        safeLog('⏱️ All contributors voted - finalizing early', { milestoneId });
        if (quorumReached && approvalReached) {
          await this.checkAndReleaseMilestone(milestoneId);
        } else {
          // Reject if conditions not met
          await this.rejectMilestone(milestoneId, 'AUTO_REJECTED', `Failed: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 60%)`);
        }
      } else if (votingPeriodEnded) {
        // Voting period ended - finalize based on current results
        safeLog('⏱️ Voting period ended - finalizing', { milestoneId });
        if (quorumReached && approvalReached) {
          await this.checkAndReleaseMilestone(milestoneId);
        } else {
          await this.rejectMilestone(milestoneId, 'AUTO_REJECTED', `Failed: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 60%)`);
        }
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

      // Update database (V3: no blockchain voting needed)
      const updatedMilestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: {
          status: MilestoneStatus.VOTING,
          voteStartTime,
          voteEndTime,
          votingDeadline: voteEndTime
        }
      });

      safeLog('✅ Voting opened successfully (V3: backend-only)', { milestoneId, voteStartTime, voteEndTime });
      
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

      // V3: No blockchain voting needed - all voting is backend-only
      safeLog('Vote recorded (V3: backend-only)', { milestoneId, userId, isApproval, votingPower });

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
      
      // FIX: Use milestone amount, not campaign goal
      const milestoneAmount = milestone.amount;
      const approvalPercentage = totalVotingPower > 0 ? (yesVotingPower / totalVotingPower) * 100 : 0;
      const quorumPercentage = milestoneAmount > 0 ? (totalVotingPower / milestoneAmount) * 100 : 0;
      
      const quorumReached = quorumPercentage >= 60; // 60% of milestone amount must vote
      const approvalReached = approvalPercentage >= 60; // 60% of votes must be YES

      // Check if all contributors have voted (early finalization)
      const uniqueContributors = new Set(
        milestone.campaign.contributions
          .filter(c => c.campaignId === milestone.campaignId)
          .map(c => c.userId)
      );
      const uniqueVoters = new Set(milestone.votes.map(v => v.userId));
      const allContributorsVoted = uniqueContributors.size === uniqueVoters.size && 
                                    uniqueContributors.size > 0 &&
                                    [...uniqueContributors].every(id => uniqueVoters.has(id));

      // Check if voting period has ended
      const votingPeriodEnded = milestone.voteEndTime ? new Date() > milestone.voteEndTime : false;

      safeLog('Checking release conditions (DB)', {
        milestoneId,
        yesVotingPower,
        noVotingPower,
        totalVotingPower,
        milestoneAmount,
        quorumReached,
        approvalReached,
        approvalPercentage: approvalPercentage.toFixed(1),
        quorumPercentage: quorumPercentage.toFixed(1),
        allContributorsVoted,
        votingPeriodEnded,
        contributorCount: uniqueContributors.size,
        voterCount: uniqueVoters.size
      });

      // Check if conditions are met AND (all voted OR period ended)
      const canFinalize = (quorumReached && approvalReached) && (allContributorsVoted || votingPeriodEnded);
      
      if (canFinalize) {
        // CRITICAL: Try blockchain release with retry logic (UniversalEscrow)
        let txHash: string | undefined;
        let blockchainReleased = false;
        const maxRetries = 3;
        
        // Get creator wallet address
        const campaignWithCreator = await prisma.campaign.findUnique({
          where: { id: milestone.campaignId },
          include: { creator: true }
        });
        
        if (!campaignWithCreator?.creator?.walletAddress) {
          safeLog('🚨 CRITICAL: Creator wallet address not found', { milestoneId, campaignId: milestone.campaignId });
          return {
            released: false,
            rejected: false,
            approvalPercentage,
            quorumPercentage,
            yesVotes: yesVotingPower,
            noVotes: noVotingPower,
            error: 'Creator wallet address not found'
          };
        }
        
        const creatorAddress = campaignWithCreator.creator.walletAddress;
        const releaseAmount = milestone.amount.toString();
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const { blockchainService } = await import('./blockchainService');
            
            safeLog(`Attempting blockchain fund release (UniversalEscrow - attempt ${attempt}/${maxRetries})`, { 
              milestoneId,
              creatorAddress,
              amount: releaseAmount
            });
            
            txHash = await blockchainService.releaseFunds(
              creatorAddress,
              releaseAmount,
              `Milestone approved: ${milestone.title}`
            );
            
            blockchainReleased = true;
            safeLog('✅ Funds released on blockchain (UniversalEscrow)!', { milestoneId, txHash, creatorAddress, amount: releaseAmount });
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
        // Refund all backers via UniversalEscrow
        try {
          const { blockchainService } = await import('./blockchainService');
          
          // Get all contributors to this milestone's campaign
          const contributors = await prisma.contribution.findMany({
            where: { campaignId: milestone.campaignId },
            include: { user: true }
          });
          
          safeLog('Processing refunds for rejected milestone (UniversalEscrow)', { 
            milestoneId, 
            contributorCount: contributors.length 
          });
          
          // Calculate total contributions and refund proportionally
          const totalContributed = contributors.reduce((sum, c) => sum + c.amount, 0);
          const milestoneRefundAmount = milestone.currentAmount; // Amount raised for this milestone
          
          let refundTxHashes: string[] = [];
          let refundErrors: string[] = [];
          
          // Refund each backer proportionally
          for (const contribution of contributors) {
            try {
              if (!contribution.user.walletAddress) {
                safeLog('⚠️ Skipping refund - no wallet address', { 
                  userId: contribution.userId,
                  contributionId: contribution.id 
                });
                continue;
              }
              
              // Calculate proportional refund amount
              const refundProportion = contribution.amount / totalContributed;
              const refundAmount = (milestoneRefundAmount * refundProportion).toFixed(6);
              
              safeLog(`Refunding ${refundAmount} POL to ${contribution.user.walletAddress}`, {
                milestoneId,
                contributionId: contribution.id
              });
              
              const txHash = await blockchainService.refundFunds(
                contribution.user.walletAddress,
                refundAmount,
                `Milestone rejected: ${milestone.title}`
              );
              
              refundTxHashes.push(txHash);
              safeLog('✅ Refund sent', { txHash, backerAddress: contribution.user.walletAddress, amount: refundAmount });
            } catch (refundError: any) {
              const errorMsg = `Failed to refund ${contribution.user.walletAddress}: ${refundError?.message}`;
              refundErrors.push(errorMsg);
              safeLog('❌ Refund failed', { 
                error: refundError?.message,
                backerAddress: contribution.user.walletAddress 
              });
            }
          }
          
          // Mark as rejected in database
          const rejectionNote = `Did not meet release conditions: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 60%). Refunds processed: ${refundTxHashes.length}/${contributors.length}${refundErrors.length > 0 ? `. Errors: ${refundErrors.join('; ')}` : ''}`;
          
          await prisma.milestone.update({
            where: { id: milestoneId },
            data: {
              status: MilestoneStatus.REJECTED,
              rejectedAt: new Date(),
              releaseTransactionHash: refundTxHashes.join(','), // Store all refund tx hashes
              adminNotes: rejectionNote
            }
          });

          safeLog('❌ Milestone rejected and refunds processed (UniversalEscrow)', { 
            milestoneId, 
            refundCount: refundTxHashes.length,
            errorCount: refundErrors.length
          });
        } catch (blockchainError: any) {
          safeLog('⚠️ Failed to process refunds on blockchain, marking DB only', { 
            error: blockchainError?.message,
            milestoneId 
          });
          
          // Still mark as rejected in DB even if blockchain fails
          await prisma.milestone.update({
            where: { id: milestoneId },
            data: {
              status: MilestoneStatus.REJECTED,
              rejectedAt: new Date(),
              adminNotes: `Did not meet release conditions: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 60%). Blockchain refunds failed: ${blockchainError?.message}`
            }
          });
        }

        return {
          released: false,
          rejected: true,
          approvalPercentage,
          quorumPercentage,
          yesVotes: yesVotingPower,
          noVotes: noVotingPower
        };
      }

      // Voting still active - log why not finalizing yet
      if (quorumReached && approvalReached) {
        safeLog('⏳ Conditions met but waiting for: all contributors to vote OR voting period to end', {
          milestoneId,
          allVoted: allContributorsVoted,
          periodEnded: votingPeriodEnded,
          voteEndTime: milestone.voteEndTime
        });
      } else {
        safeLog('⏳ Voting active, conditions not yet met', {
          milestoneId,
          quorumReached,
          approvalReached
        });
      }
      
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

      // FIX: Use milestone amount, not campaign target
      const quorumPercentage = (totalVotingPower / milestone.amount) * 100;
      const quorumReached = quorumPercentage >= 60;

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

      // FIX: Verify voting conditions are met before allowing admin force release
      const totalVotingPower = milestone.votes.reduce((sum, v) => sum + v.votingPower, 0);
      const yesVotingPower = milestone.votes
        .filter(v => v.isApproval)
        .reduce((sum, v) => sum + v.votingPower, 0);
      
      // FIX: Use milestone amount, not campaign goal
      const milestoneAmount = milestone.amount;
      const approvalPercentage = totalVotingPower > 0 ? (yesVotingPower / totalVotingPower) * 100 : 0;
      const quorumPercentage = (totalVotingPower / milestoneAmount) * 100;

      // FIX: Require 60% quorum of milestone amount and 60% approval
      if (approvalPercentage < 60 || quorumPercentage < 60) {
        throw new Error(`⛔ Cannot force release - conditions not met: ${approvalPercentage.toFixed(1)}% approval (need 60%), ${quorumPercentage.toFixed(1)}% quorum (need 60% of milestone amount)`);
      }

      safeLog('🔧 Admin forcing blockchain release (UniversalEscrow: Manual Release)', { milestoneId });

      // UniversalEscrow: Force blockchain release to creator address (emergency only)
      let txHash: string | undefined;
      try {
        const { blockchainService } = await import('./blockchainService');
        
        // Get creator wallet address
        const campaignWithCreator = await prisma.campaign.findUnique({
          where: { id: milestone.campaignId },
          include: { creator: true }
        });
        
        if (!campaignWithCreator?.creator?.walletAddress) {
          throw new Error('Creator wallet address not found');
        }
        
        const creatorAddress = campaignWithCreator.creator.walletAddress;
        const releaseAmount = milestone.amount.toString();
        
        txHash = await blockchainService.releaseFunds(
          creatorAddress,
          releaseAmount,
          `Admin force release: ${milestone.title}`
        );
        
        safeLog('✅ Admin force release successful (UniversalEscrow)', { 
          milestoneId, 
          txHash, 
          creatorAddress, 
          amount: releaseAmount 
        });
      } catch (blockchainError: any) {
        throw new Error(`Blockchain release failed: ${blockchainError?.message}`);
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