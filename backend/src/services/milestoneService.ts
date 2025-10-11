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

      const totalMilestoneAmount = milestonesData.reduce((sum, m) => sum + m.amount, 0);
      if (totalMilestoneAmount > campaign.targetAmount) {
        throw new Error('Total milestone amounts cannot exceed campaign target amount');
      }

      // Create milestones in a transaction
      const milestones = await prisma.$transaction(async (tx) => {
        const createdMilestones = [];
        for (const milestoneData of milestonesData) {
          const milestone = await tx.milestone.create({
            data: {
              ...milestoneData,
              campaignId
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

      if (milestone.status !== MilestoneStatus.PENDING) {
        throw new Error('Milestone is not in pending status');
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

        // Update milestone status
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            status: MilestoneStatus.SUBMITTED,
            submittedAt: new Date(),
            evidence: submissionData.evidence,
            votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        });

        return { submission, milestone: updatedMilestone };
      });

      safeLog('Milestone submitted successfully', { milestoneId, userId });
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
        submitted: milestones.filter(m => m.status === MilestoneStatus.SUBMITTED).length,
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
}

export default MilestoneService; 