import prisma from '../config/database';

async function fixAllOrphanedMilestones() {
  try {
    console.log('🔧 Fixing All Orphaned Milestones (V1/V2 → V3 Migration)\n');

    // Find all milestones in VOTING status
    const votingMilestones = await prisma.milestone.findMany({
      where: {
        status: 'VOTING'
      },
      include: {
        campaign: true,
        votes: true
      }
    });

    if (votingMilestones.length === 0) {
      console.log('✅ No milestones in VOTING status to fix');
      return;
    }

    console.log(`Found ${votingMilestones.length} milestone(s) in VOTING status\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const milestone of votingMilestones) {
      console.log(`${'='.repeat(80)}`);
      console.log(`Campaign: ${milestone.campaign.title}`);
      console.log(`Milestone: ${milestone.title}`);
      console.log(`Amount: $${milestone.amount}`);
      console.log(`Blockchain Index: ${milestone.blockchainMilestoneIndex ?? 'null'}`);
      console.log(`Votes: ${milestone.votes.length}\n`);

      // Check if this is likely an orphaned milestone
      // Criteria: Either no blockchain index OR index points to wrong milestone
      const isOrphaned = milestone.blockchainMilestoneIndex === null || 
                         milestone.blockchainMilestoneIndex === 0; // Index 0 is the V3 test milestone

      if (isOrphaned) {
        console.log('⚠️ Identified as ORPHANED (pre-V3 milestone)');
        console.log('   Resetting to ACTIVE status...\n');

        // Reset milestone
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: 'ACTIVE',
            voteStartTime: null,
            voteEndTime: null,
            votingDeadline: null,
            blockchainMilestoneIndex: null,
            adminNotes: 'Reset from VOTING - Pre-V3 contributions went to V1/V2 contracts. This milestone needs NEW contributions to V3 contract before it can be completed. Previous $' + milestone.currentAmount + ' contributions are on old contracts.'
          }
        });

        // Delete votes
        const deletedVotes = await prisma.vote.deleteMany({
          where: { milestoneId: milestone.id }
        });

        console.log(`✅ Reset to ACTIVE`);
        console.log(`✅ Cleared ${deletedVotes.count} vote(s)`);
        fixedCount++;
      } else {
        console.log('✅ Has valid blockchain index - skipping');
        skippedCount++;
      }
      
      console.log('');
    }

    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixedCount} milestone(s)`);
    console.log(`   Skipped: ${skippedCount} milestone(s)`);
    
    if (fixedCount > 0) {
      console.log(`\n📌 Next Steps for Reset Campaigns:`);
      console.log(`   1. These campaigns need NEW contributions to V3 contract`);
      console.log(`   2. Old contributions ($25, $55, etc.) are on V1/V2 contracts`);
      console.log(`   3. Once V3 contributions fund the milestone, voting can start`);
      console.log(`   4. Then proper blockchain release from V3 will work\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllOrphanedMilestones();
