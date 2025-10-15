import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Update fully funded ACTIVE milestones to PENDING status
 * This allows creators to submit proof and start voting
 */
async function updateFullyFundedMilestones() {
  try {
    console.log('🔍 Finding fully funded ACTIVE milestones...\n');

    // Get all ACTIVE milestones
    const activeMilestones = await prisma.milestone.findMany({
      where: { status: 'ACTIVE' },
      include: { campaign: true }
    });

    console.log(`Found ${activeMilestones.length} ACTIVE milestones\n`);

    let updatedCount = 0;

    for (const milestone of activeMilestones) {
      const currentAmount = parseFloat(milestone.currentAmount.toString());
      const targetAmount = parseFloat(milestone.amount.toString());
      const percentage = ((currentAmount / targetAmount) * 100).toFixed(1);

      console.log(`📊 ${milestone.campaign.title} - Milestone ${milestone.order}`);
      console.log(`   "${milestone.title}"`);
      console.log(`   $${currentAmount}/$${targetAmount} (${percentage}%)`);

      if (currentAmount >= targetAmount) {
        // Fully funded! Change to PENDING
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: 'PENDING' }
        });
        console.log(`   ✅ FULLY FUNDED - Changed to PENDING (awaiting proof submission)\n`);
        updatedCount++;
      } else {
        console.log(`   ⏳ Still active (${(targetAmount - currentAmount).toFixed(2)} remaining)\n`);
      }
    }

    if (updatedCount === 0) {
      console.log('✅ No fully funded ACTIVE milestones found');
    } else {
      console.log(`\n✅ Updated ${updatedCount} milestone(s) to PENDING status`);
      console.log('\n📝 Next Steps for Creators:');
      console.log('   1. Go to campaign milestone page');
      console.log('   2. Click "Submit Proof of Completion"');
      console.log('   3. Upload evidence (photos, documents, links)');
      console.log('   4. Voting period begins (7 days)');
      console.log('   5. Funds automatically released if approved');
    }

  } catch (error) {
    console.error('Error updating milestones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateFullyFundedMilestones()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
