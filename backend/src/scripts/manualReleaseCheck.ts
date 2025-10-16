import MilestoneService from '../services/milestoneService';
import { prisma } from '../config/database';

async function manualReleaseCheck() {
  try {
    const milestoneId = 'cmgrvssax0003rdtc3wnk57s3';
    
    console.log('🔍 Manually checking release conditions for milestone:', milestoneId);
    
    const result = await MilestoneService.checkAndReleaseMilestone(milestoneId);
    
    console.log('\n📊 Results:');
    console.log('  Released:', result.released);
    console.log('  Rejected:', result.rejected);
    console.log('  Approval:', result.approvalPercentage.toFixed(1) + '%');
    console.log('  Quorum:', result.quorumPercentage.toFixed(1) + '%');
    console.log('  Yes Votes:', result.yesVotes);
    console.log('  No Votes:', result.noVotes);
    
    if (result.released) {
      console.log('\n✅ Milestone RELEASED successfully!');
      if (result.transactionHash) {
        console.log('  Transaction:', result.transactionHash);
      }
    } else if (result.rejected) {
      console.log('\n❌ Milestone REJECTED');
    } else {
      console.log('\n⏳ Conditions not yet met');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualReleaseCheck()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
