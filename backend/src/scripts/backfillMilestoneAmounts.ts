import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Backfill milestone currentAmount based on actual contributions
 * This fixes the issue where milestones have currentAmount = 0 despite having contributions
 */
async function backfillMilestoneAmounts() {
  try {
    console.log('Starting milestone currentAmount backfill...\n');

    // Get all campaigns that require milestones
    const campaigns = await prisma.campaign.findMany({
      where: { requiresMilestones: true },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        },
        contributions: {
          where: { status: 'CONFIRMED' },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`Found ${campaigns.length} campaigns with milestones\n`);

    let totalUpdated = 0;

    for (const campaign of campaigns) {
      if (campaign.milestones.length === 0) {
        console.log(`⚠️  Campaign "${campaign.title}" has no milestones, skipping...`);
        continue;
      }

      console.log(`\n📊 Campaign: ${campaign.title}`);
      console.log(`   Total Raised: $${campaign.currentAmount}`);
      console.log(`   Contributions: ${campaign.contributions.length}`);
      console.log(`   Milestones: ${campaign.milestones.length}`);

      // Calculate total contribution amount
      let remainingAmount = 0;
      for (const contribution of campaign.contributions) {
        remainingAmount += parseFloat(contribution.amount.toString());
      }

      console.log(`   Total Contribution Amount: $${remainingAmount.toFixed(2)}`);

      // Distribute contributions across milestones in order
      for (const milestone of campaign.milestones) {
        if (remainingAmount <= 0) break;

        const milestoneTarget = parseFloat(milestone.amount.toString());
        const allocated = Math.min(remainingAmount, milestoneTarget);

        // Update milestone currentAmount
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: { currentAmount: allocated }
        });

        console.log(`   ✅ Milestone ${milestone.order}: "${milestone.title}"`);
        console.log(`      Target: $${milestoneTarget} | Allocated: $${allocated.toFixed(2)} | Status: ${milestone.status}`);

        remainingAmount -= allocated;
        totalUpdated++;
      }

      if (remainingAmount > 0) {
        console.log(`   ⚠️  Remaining unallocated: $${remainingAmount.toFixed(2)}`);
      }
    }

    console.log(`\n✅ Backfill complete! Updated ${totalUpdated} milestones`);

    // Show summary of active milestones with contributions
    console.log('\n📋 Active Milestones Summary:');
    const activeMilestones = await prisma.milestone.findMany({
      where: { status: 'ACTIVE' },
      include: { campaign: true }
    });

    for (const milestone of activeMilestones) {
      const percentage = ((milestone.currentAmount / parseFloat(milestone.amount.toString())) * 100).toFixed(1);
      const isFunded = milestone.currentAmount >= parseFloat(milestone.amount.toString());
      console.log(`   ${isFunded ? '🎯' : '💰'} ${milestone.campaign.title} - Milestone ${milestone.order}`);
      console.log(`      $${milestone.currentAmount.toFixed(2)} / $${milestone.amount} (${percentage}%) ${isFunded ? '✅ FULLY FUNDED' : ''}`);
    }

  } catch (error) {
    console.error('Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
backfillMilestoneAmounts()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
