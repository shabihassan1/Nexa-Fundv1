import { prisma } from '../config/database';

async function fixVotingMilestones() {
  try {
    console.log('Starting: Fix VOTING milestones with missing voteStartTime/voteEndTime...');

    // Find all VOTING milestones without voteEndTime
    const votingMilestones = await prisma.milestone.findMany({
      where: {
        status: 'VOTING',
        voteEndTime: null
      }
    });

    console.log(`Found ${votingMilestones.length} VOTING milestones without voteEndTime`);

    if (votingMilestones.length === 0) {
      console.log('No milestones need fixing. ✅');
      return;
    }

    // Update each milestone
    for (const milestone of votingMilestones) {
      const submittedAt = milestone.submittedAt || new Date();
      const voteEndTime = new Date(submittedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from submission

      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          voteStartTime: submittedAt,
          voteEndTime: voteEndTime,
          votingDeadline: voteEndTime
        }
      });

      console.log(`✅ Fixed milestone: ${milestone.title} (ID: ${milestone.id})`);
      console.log(`   Vote period: ${submittedAt.toISOString()} → ${voteEndTime.toISOString()}`);
    }

    console.log(`\n✅ Successfully fixed ${votingMilestones.length} milestones!`);
  } catch (error) {
    console.error('❌ Error fixing milestones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixVotingMilestones()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
