import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function resetContributions() {
  try {
    console.log('🔄 Starting contribution reset process...\n');

    // Get current contribution count
    const contributionCount = await prisma.contribution.count();
    console.log(`📊 Found ${contributionCount} contributions to delete`);

    // Get affected campaigns
    const campaigns = await prisma.campaign.findMany({
      include: {
        contributions: true,
        milestones: true
      }
    });

    console.log(`📊 ${campaigns.length} campaigns will be reset\n`);

    // Delete all contributions
    console.log('🗑️  Deleting all contributions...');
    const deletedContributions = await prisma.contribution.deleteMany({});
    console.log(`✅ Deleted ${deletedContributions.count} contributions\n`);

    // Delete all votes (since they depend on contributions)
    console.log('🗑️  Deleting all votes...');
    const deletedVotes = await prisma.vote.deleteMany({});
    console.log(`✅ Deleted ${deletedVotes.count} votes\n`);

    // Delete all escrow transactions
    console.log('🗑️  Deleting all escrow transactions...');
    const deletedTransactions = await prisma.escrowTransaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.count} escrow transactions\n`);

    // Reset campaign amounts
    console.log('🔄 Resetting campaign amounts...');
    for (const campaign of campaigns) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          currentAmount: 0,
          escrowAmount: 0,
          releasedAmount: 0
        }
      });
      console.log(`   ✅ Reset campaign: ${campaign.title}`);
    }

    // Reset milestone amounts and statuses
    console.log('\n🔄 Resetting milestone amounts and statuses...');
    const allMilestones = await prisma.milestone.findMany({
      orderBy: { order: 'asc' }
    });

    for (const milestone of allMilestones) {
      // First milestone (order 1) should be ACTIVE, others PENDING
      const newStatus = milestone.order === 1 ? 'ACTIVE' : 'PENDING';
      
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          currentAmount: 0,
          status: newStatus,
          votesFor: 0,
          votesAgainst: 0,
          submittedAt: null,
          approvedAt: null,
          rejectedAt: null,
          voteStartTime: null,
          voteEndTime: null,
          votingDeadline: null,
          releaseTransactionHash: null,
          adminNotes: null,
          evidence: null
        }
      });
      console.log(`   ✅ Reset milestone: ${milestone.title} (Order ${milestone.order}) → ${newStatus}`);
    }

    console.log('\n✅ Contribution reset complete!\n');
    console.log('📊 Summary:');
    console.log(`   - ${deletedContributions.count} contributions deleted`);
    console.log(`   - ${deletedVotes.count} votes deleted`);
    console.log(`   - ${deletedTransactions.count} escrow transactions deleted`);
    console.log(`   - ${campaigns.length} campaigns reset to $0`);
    console.log(`   - ${allMilestones.length} milestones reset`);
    console.log('\n🎯 System is ready for fresh contributions!');

  } catch (error) {
    console.error('❌ Error resetting contributions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetContributions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
