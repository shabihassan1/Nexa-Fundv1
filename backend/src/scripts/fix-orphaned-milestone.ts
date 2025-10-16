import prisma from '../config/database';

async function fixOrphanedMilestone() {
  try {
    console.log('🔧 Fixing Orphaned GreenSpace Milestone\n');

    const milestone = await prisma.milestone.findFirst({
      where: {
        title: {
          contains: 'Site Preparation',
          mode: 'insensitive'
        },
        status: 'VOTING'
      },
      include: {
        campaign: true
      }
    });

    if (!milestone) {
      console.log('❌ Milestone not found');
      return;
    }

    console.log(`📋 Milestone: ${milestone.title}`);
    console.log(`Campaign: ${milestone.campaign.title}`);
    console.log(`Status: ${milestone.status}\n`);

    console.log('⚠️ Issue: This milestone\'s contributions went to V1/V2 contracts.');
    console.log('   V3 contract doesn\'t have this campaign\'s milestones.');
    console.log('   Cannot release funds from V3 contract.\n');

    console.log('🔧 Solution: Reset milestone to ACTIVE status');
    console.log('   - Clear voting state');
    console.log('   - Remove admin notes about blockchain failure');
    console.log('   - Wait for real V3 contributions before voting\n');

    const confirm = true; // Auto-confirm for script

    if (confirm) {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          status: 'ACTIVE',
          voteStartTime: null,
          voteEndTime: null,
          votingDeadline: null,
          adminNotes: 'Reset from VOTING - Old contributions were to V1/V2 contracts. Waiting for V3 contributions before milestone can be completed.'
        }
      });

      // Delete existing votes
      await prisma.vote.deleteMany({
        where: { milestoneId: milestone.id }
      });

      console.log('✅ Milestone reset to ACTIVE');
      console.log('✅ Votes cleared');
      console.log('\n📌 Next Steps:');
      console.log('   1. Campaign needs NEW contributions to V3 contract');
      console.log('   2. Once funded, milestone can enter VOTING');
      console.log('   3. Then proper blockchain release to V3');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanedMilestone();
