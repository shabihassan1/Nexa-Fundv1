import prisma from '../config/database';

async function checkAllVotingMilestones() {
  try {
    console.log('🔍 Checking All VOTING Milestones for V3 Compatibility\n');

    const votingMilestones = await prisma.milestone.findMany({
      where: {
        status: 'VOTING'
      },
      include: {
        campaign: true,
        votes: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (votingMilestones.length === 0) {
      console.log('✅ No milestones in VOTING status');
      return;
    }

    console.log(`Found ${votingMilestones.length} milestone(s) in VOTING:\n`);

    for (const milestone of votingMilestones) {
      console.log(`${'='.repeat(80)}`);
      console.log(`Campaign: ${milestone.campaign.title}`);
      console.log(`Milestone: ${milestone.title}`);
      console.log(`Amount: $${milestone.amount}`);
      console.log(`Blockchain Index: ${milestone.blockchainMilestoneIndex ?? 'null'}`);
      console.log(`Votes: ${milestone.votes.length}`);
      
      if (milestone.blockchainMilestoneIndex === null) {
        console.log('⚠️ WARNING: No blockchain milestone index!');
        console.log('   This milestone likely predates V3 contract.');
        console.log('   Should be reset to ACTIVE or manually assigned index.');
      } else {
        console.log('✅ Has blockchain index - should work with V3');
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllVotingMilestones();
