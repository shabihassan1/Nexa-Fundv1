import prisma from '../config/database';

async function resetAllOrphanedMilestones() {
  try {
    console.log('🔧 Resetting ALL Orphaned Milestones (Complete Fix)\n');
    console.log('='.repeat(80));

    // Find all milestones with blockchain index 0, 1, or 2 (V3 test milestone indices)
    // OR with null index
    // These are ALL pointing to V3 test milestones, not real campaign milestones
    const orphanedMilestones = await prisma.milestone.findMany({
      where: {
        OR: [
          { blockchainMilestoneIndex: { in: [0, 1, 2] } },
          { blockchainMilestoneIndex: null },
          { 
            adminNotes: {
              contains: 'REQUIRES MANUAL RELEASE',
              mode: 'insensitive'
            }
          }
        ],
        status: {
          in: ['VOTING', 'ACTIVE']
        }
      },
      include: {
        campaign: {
          include: {
            contributions: true
          }
        },
        votes: true
      }
    });

    console.log(`\nFound ${orphanedMilestones.length} potentially orphaned milestone(s)\n`);

    let resetCount = 0;

    for (const milestone of orphanedMilestones) {
      // Check if campaign has contributions with transaction hashes
      // If yes, these are V1/V2 contributions, not V3
      const hasOldContributions = milestone.campaign.contributions.some(c => c.transactionHash !== null);

      console.log(`${'='.repeat(80)}`);
      console.log(`Campaign: ${milestone.campaign.title}`);
      console.log(`Milestone: ${milestone.title}`);
      console.log(`Amount: $${milestone.amount}`);
      console.log(`Status: ${milestone.status}`);
      console.log(`Blockchain Index: ${milestone.blockchainMilestoneIndex ?? 'null'}`);
      console.log(`Old Contributions: ${hasOldContributions ? 'YES (V1/V2)' : 'NO'}`);
      console.log(`Votes: ${milestone.votes.length}\n`);

      if (hasOldContributions || milestone.blockchainMilestoneIndex !== null) {
        console.log('⚠️ ORPHANED - Resetting...\n');

        // Reset milestone
        await prisma.milestone.update({
          where: { id: milestone.id },
          data: {
            status: 'ACTIVE',
            voteStartTime: null,
            voteEndTime: null,
            votingDeadline: null,
            blockchainMilestoneIndex: null,
            adminNotes: `🔄 RESET: This milestone had contributions from V1/V2 contracts (total: $${milestone.campaign.currentAmount}). V3 contract was not funded. Needs NEW contributions to V3 contract at 0xAEC2007a4C54E23fDa570281346b9b070661DaBB before voting can proceed.`
          }
        });

        // Delete votes
        const deletedVotes = await prisma.vote.deleteMany({
          where: { milestoneId: milestone.id }
        });

        console.log(`✅ Reset to ACTIVE`);
        console.log(`✅ Cleared ${deletedVotes.count} vote(s)`);
        resetCount++;
      } else {
        console.log('✅ No old contributions - keeping as is');
      }
      
      console.log('');
    }

    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Reset: ${resetCount} milestone(s)`);
    console.log(`   Skipped: ${orphanedMilestones.length - resetCount} milestone(s)\n`);

    if (resetCount > 0) {
      console.log(`✅ All orphaned milestones have been reset to ACTIVE`);
      console.log(`\n📌 For these campaigns to work:`);
      console.log(`   1. Contributors must make NEW donations`);
      console.log(`   2. Use V3 contract: 0xAEC2007a4C54E23fDa570281346b9b070661DaBB`);
      console.log(`   3. Then milestones can progress through voting`);
      console.log(`   4. Blockchain release will work correctly\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllOrphanedMilestones();
