import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Check all milestones and show their availability status
 * This helps verify the new intelligent milestone availability logic
 */
async function checkMilestoneAvailability() {
  try {
    console.log('🔍 Checking milestone availability with new intelligent logic...\n');

    const campaigns = await prisma.campaign.findMany({
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    for (const campaign of campaigns) {
      if (campaign.milestones.length === 0) {
        console.log(`📊 ${campaign.title}`);
        console.log(`   ⚠️  No milestones\n`);
        continue;
      }

      console.log(`📊 ${campaign.title}`);
      console.log(`   Raised: $${campaign.currentAmount} / $${campaign.targetAmount}`);
      console.log(`   Milestones: ${campaign.milestones.length}\n`);

      let availableFound = false;

      for (const milestone of campaign.milestones) {
        const currentAmount = parseFloat(milestone.currentAmount.toString());
        const targetAmount = parseFloat(milestone.amount.toString());
        const isFullyFunded = currentAmount >= targetAmount;
        const percentage = ((currentAmount / targetAmount) * 100).toFixed(1);

        // Determine if this milestone is available for contributions
        let isAvailable = false;
        let reason = '';

        if (milestone.order === 1) {
          // First milestone: Available if not fully funded
          if (!isFullyFunded) {
            isAvailable = true;
            reason = 'First milestone, not fully funded';
          } else {
            reason = 'Fully funded, awaiting proof/approval';
          }
        } else {
          // Check previous milestone
          const previousMilestone = campaign.milestones.find(m => m.order === milestone.order - 1);
          
          if (previousMilestone) {
            const prevCurrentAmount = parseFloat(previousMilestone.currentAmount.toString());
            const prevTargetAmount = parseFloat(previousMilestone.amount.toString());
            const isPrevFullyFunded = prevCurrentAmount >= prevTargetAmount;
            const isPrevApproved = previousMilestone.status === 'APPROVED';

            if (isPrevFullyFunded && isPrevApproved && !isFullyFunded) {
              isAvailable = true;
              reason = 'Previous milestone approved';
            } else if (!isPrevFullyFunded) {
              reason = 'Previous milestone not fully funded yet';
            } else if (!isPrevApproved) {
              reason = `Previous milestone ${previousMilestone.status}`;
            } else {
              reason = 'Fully funded, awaiting proof/approval';
            }
          }
        }

        const statusIcon = isAvailable ? '✅' : milestone.status === 'APPROVED' ? '🎯' : '⏸️';
        
        console.log(`   ${statusIcon} Milestone ${milestone.order}: ${milestone.title}`);
        console.log(`      Amount: $${currentAmount} / $${targetAmount} (${percentage}%)`);
        console.log(`      Status: ${milestone.status}`);
        console.log(`      ${isAvailable ? '🟢 AVAILABLE FOR CONTRIBUTIONS' : `🔴 ${reason}`}`);
        console.log();

        if (isAvailable && !availableFound) {
          availableFound = true;
        }
      }

      console.log(`   Campaign can accept contributions: ${availableFound ? '✅ YES' : '❌ NO'}\n`);
      console.log('---\n');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkMilestoneAvailability()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
