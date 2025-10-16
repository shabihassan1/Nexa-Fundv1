import cron from 'node-cron';
import { MilestoneStatus } from '../generated/prisma';
import { prisma } from '../config/database';

/**
 * Automated Milestone Release Checker
 * Runs every hour to check if voting periods have ended and release conditions are met
 * 
 * Process:
 * 1. Find all milestones in VOTING status with expired voting periods
 * 2. For each expired milestone, check release conditions on blockchain
 * 3. If conditions met (60% approval, 10% quorum), finalize and release funds
 * 4. Update milestone status and activate next milestone
 */
export class MilestoneReleaseJob {
  private static jobRunning = false;
  
  /**
   * Start the cron job - runs every hour at minute 0
   * Cron pattern: "0 * * * *" = every hour at 00 minutes
   */
  static start() {
    console.log('🕒 Milestone Release Job: Starting automated checker (runs hourly)...');
    
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      if (this.jobRunning) {
        console.log('⏩ Milestone Release Job: Previous job still running, skipping...');
        return;
      }

      try {
        this.jobRunning = true;
        console.log(`\n🔍 [${new Date().toISOString()}] Milestone Release Job: Checking for expired voting periods...`);
        
        await this.checkExpiredVotingMilestones();
        
        console.log(`✅ [${new Date().toISOString()}] Milestone Release Job: Check completed\n`);
      } catch (error: any) {
        console.error(`❌ [${new Date().toISOString()}] Milestone Release Job: Error:`, error?.message || error);
      } finally {
        this.jobRunning = false;
      }
    });

    console.log('✅ Milestone Release Job: Cron job scheduled successfully');
  }

  /**
   * Manual trigger for testing purposes
   */
  static async runManually() {
    console.log('🔧 Milestone Release Job: Manual trigger initiated...');
    
    if (this.jobRunning) {
      console.log('⚠️ Job already running, please wait...');
      return;
    }

    try {
      this.jobRunning = true;
      await this.checkExpiredVotingMilestones();
      console.log('✅ Manual check completed');
    } catch (error: any) {
      console.error('❌ Manual check failed:', error?.message || error);
    } finally {
      this.jobRunning = false;
    }
  }

  /**
   * Core logic: Find and process expired voting periods
   */
  private static async checkExpiredVotingMilestones() {
    // Find all milestones in VOTING status where voteEndTime has passed
    const now = new Date();
    const expiredMilestones = await prisma.milestone.findMany({
      where: {
        status: MilestoneStatus.VOTING,
        voteEndTime: {
          lt: now // Less than current time = expired
        }
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            targetAmount: true,
            creatorId: true
          }
        },
        votes: true
      }
    });

    if (expiredMilestones.length === 0) {
      console.log('   ℹ️  No expired voting periods found');
      return;
    }

    console.log(`   📋 Found ${expiredMilestones.length} expired voting period(s)`);

    // Process each expired milestone
    for (const milestone of expiredMilestones) {
      try {
        await this.processExpiredMilestone(milestone);
      } catch (error: any) {
        console.error(`   ❌ Failed to process milestone ${milestone.id}:`, error?.message || error);
        // Continue with other milestones even if one fails
      }
    }
  }

  /**
   * Process a single expired milestone
   */
  private static async processExpiredMilestone(milestone: any) {
    console.log(`\n   🎯 Processing: Milestone #${milestone.milestoneNumber} - "${milestone.title}"`);
    console.log(`      Campaign: "${milestone.campaign.title}"`);
    console.log(`      Vote End Time: ${milestone.voteEndTime.toISOString()}`);

    // Dynamically import to avoid circular dependencies
    const MilestoneService = (await import('../services/milestoneService')).default;

    try {
      // Attempt to check and release the milestone
      const result = await MilestoneService.checkAndReleaseMilestone(milestone.id);
      
      if (result.released) {
        console.log(`      ✅ RELEASED: Funds released to creator`);
        console.log(`      💰 Transaction: ${result.transactionHash}`);
        console.log(`      📊 Stats: ${result.approvalPercentage.toFixed(1)}% approval, ${result.quorumPercentage.toFixed(1)}% quorum`);
        console.log(`      👍 Yes: ${result.yesVotes.toFixed(2)}, 👎 No: ${result.noVotes.toFixed(2)}`);
      } else if (result.rejected) {
        console.log(`      ❌ REJECTED: Insufficient approval or quorum`);
        console.log(`      📊 Stats: ${result.approvalPercentage.toFixed(1)}% approval (need 60%), ${result.quorumPercentage.toFixed(1)}% quorum (need 10%)`);
        console.log(`      👍 Yes: ${result.yesVotes.toFixed(2)}, 👎 No: ${result.noVotes.toFixed(2)}`);
      } else {
        // Voting period expired but conditions not met - mark as REJECTED
        console.log(`      ❌ REJECTED: Voting period expired without meeting conditions`);
        console.log(`      📊 Stats: ${result.approvalPercentage.toFixed(1)}% approval (need 60%), ${result.quorumPercentage.toFixed(1)}% quorum (need 10%)`);
        console.log(`      👍 Yes: ${result.yesVotes.toFixed(2)}, 👎 No: ${result.noVotes.toFixed(2)}`);
        
        // Mark milestone as rejected since voting period is over
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: MilestoneStatus.REJECTED,
            rejectedAt: new Date(),
            adminNotes: `Voting expired: ${result.approvalPercentage.toFixed(1)}% approval, ${result.quorumPercentage.toFixed(1)}% quorum`
          }
        });
      }
    } catch (error: any) {
      // Log error but don't throw - let other milestones process
      console.error(`      ⚠️  Error processing milestone:`, error?.message || error);
      
      // If it's a blockchain error, we might want to retry later
      if (error?.message?.includes('blockchain') || error?.message?.includes('contract')) {
        console.log(`      🔄 Will retry in next scheduled run`);
      } else {
        // For other errors, mark as failed to prevent infinite retries
        console.log(`      ⚠️  Marking milestone as REJECTED to prevent retry loop`);
        try {
          await prisma.milestone.update({
            where: { id: milestone.id },
            data: { 
              status: MilestoneStatus.REJECTED,
              voteEndTime: null 
            }
          });
        } catch (updateError: any) {
          console.error(`      ❌ Failed to update milestone status:`, updateError?.message);
        }
      }
    }
  }

  /**
   * Stop the cron job (useful for testing or graceful shutdown)
   */
  static stop() {
    console.log('⏸️  Milestone Release Job: Stopping automated checker...');
    // Note: node-cron tasks can't be easily stopped once started
    // This is more of a placeholder for future implementation
  }
}

// Export a function to start the job
export const startMilestoneReleaseJob = () => {
  MilestoneReleaseJob.start();
};

// Export manual trigger for API endpoint (optional)
export const triggerManualCheck = async () => {
  await MilestoneReleaseJob.runManually();
};
