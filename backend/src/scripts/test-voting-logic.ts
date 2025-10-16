import prisma from '../config/database';

async function testVotingLogic() {
  try {
    console.log('🧪 Testing Voting Finalization Logic\n');

    // Find a milestone in VOTING status
    const milestone = await prisma.milestone.findFirst({
      where: {
        status: 'VOTING'
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

    if (!milestone) {
      console.log('❌ No milestone in VOTING status found');
      return;
    }

    console.log(`📋 Testing Milestone: ${milestone.title}`);
    console.log(`Campaign: ${milestone.campaign.title}`);
    console.log(`Status: ${milestone.status}\n`);

    // Calculate voting statistics
    const totalVotingPower = milestone.votes.reduce((sum, v) => sum + v.votingPower, 0);
    const yesVotingPower = milestone.votes
      .filter(v => v.isApproval)
      .reduce((sum, v) => sum + v.votingPower, 0);
    const noVotingPower = totalVotingPower - yesVotingPower;
    
    const milestoneAmount = milestone.amount;
    const approvalPercentage = totalVotingPower > 0 ? (yesVotingPower / totalVotingPower) * 100 : 0;
    const quorumPercentage = milestoneAmount > 0 ? (totalVotingPower / milestoneAmount) * 100 : 0;
    
    const quorumReached = quorumPercentage >= 60;
    const approvalReached = approvalPercentage >= 60;

    // Check contributors vs voters
    const uniqueContributors = new Set(
      milestone.campaign.contributions
        .filter(c => c.campaignId === milestone.campaignId)
        .map(c => c.userId)
    );
    const uniqueVoters = new Set(milestone.votes.map(v => v.userId));
    const allContributorsVoted = uniqueContributors.size === uniqueVoters.size && 
                                  uniqueContributors.size > 0 &&
                                  [...uniqueContributors].every(id => uniqueVoters.has(id));

    // Check voting period
    const votingPeriodEnded = milestone.voteEndTime ? new Date() > milestone.voteEndTime : false;
    const now = new Date();
    const timeRemaining = milestone.voteEndTime ? 
      Math.max(0, milestone.voteEndTime.getTime() - now.getTime()) : 0;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    console.log('📊 Voting Statistics:');
    console.log(`   Approval: ${approvalPercentage.toFixed(1)}% (${approvalReached ? '✅' : '❌'} need 60%)`);
    console.log(`   Quorum: ${quorumPercentage.toFixed(1)}% (${quorumReached ? '✅' : '❌'} need 60%)`);
    console.log(`   Yes Votes: $${yesVotingPower}`);
    console.log(`   No Votes: $${noVotingPower}`);
    console.log(`   Total Voting Power: $${totalVotingPower} / $${milestoneAmount}\n`);

    console.log('👥 Contributor Participation:');
    console.log(`   Total Contributors: ${uniqueContributors.size}`);
    console.log(`   Total Voters: ${uniqueVoters.size}`);
    console.log(`   All Voted: ${allContributorsVoted ? '✅ YES' : '❌ NO'}`);
    
    if (!allContributorsVoted) {
      const contributorList = [...uniqueContributors];
      const voterList = [...uniqueVoters];
      const notVoted = contributorList.filter(id => !voterList.includes(id));
      console.log(`   Pending: ${notVoted.length} contributor(s) haven't voted yet`);
    }
    console.log('');

    console.log('⏰ Voting Period:');
    console.log(`   Start: ${milestone.voteStartTime?.toLocaleString() || 'Not set'}`);
    console.log(`   End: ${milestone.voteEndTime?.toLocaleString() || 'Not set'}`);
    console.log(`   Period Ended: ${votingPeriodEnded ? '✅ YES' : '❌ NO'}`);
    if (!votingPeriodEnded && milestone.voteEndTime) {
      console.log(`   Time Remaining: ${hoursRemaining}h ${minutesRemaining}m`);
    }
    console.log('');

    // Determine if can finalize
    const canFinalize = (quorumReached && approvalReached) && (allContributorsVoted || votingPeriodEnded);

    console.log('🎯 Finalization Check:');
    console.log(`   Conditions Met: ${quorumReached && approvalReached ? '✅ YES' : '❌ NO'}`);
    console.log(`   Can Finalize: ${canFinalize ? '✅ YES' : '❌ NO'}\n`);

    if (!canFinalize) {
      console.log('⏳ WAITING FOR:');
      if (!quorumReached || !approvalReached) {
        if (!quorumReached) console.log('   - Quorum to reach 60%');
        if (!approvalReached) console.log('   - Approval to reach 60%');
      } else {
        console.log('   ✅ Conditions met, but...');
        if (!allContributorsVoted && !votingPeriodEnded) {
          console.log('   - All contributors to vote OR');
          console.log('   - Voting period to end');
        }
      }
    } else {
      console.log('🎉 READY TO FINALIZE!');
      if (allContributorsVoted) {
        console.log('   Reason: All contributors have voted (early finalization)');
      } else {
        console.log('   Reason: Voting period has ended');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVotingLogic();
