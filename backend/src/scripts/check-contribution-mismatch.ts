import prisma from '../config/database';

async function checkContributionMismatch() {
  try {
    console.log('🔍 Checking Campaign-Contract Mismatch\n');

    const campaigns = await prisma.campaign.findMany({
      where: {
        currentAmount: { gt: 0 }
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        },
        contributions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${campaigns.length} campaigns with contributions:\n`);

    for (const campaign of campaigns) {
      console.log(`${'='.repeat(80)}`);
      console.log(`Campaign: ${campaign.title}`);
      console.log(`Current Amount: $${campaign.currentAmount}`);
      console.log(`Contributions: ${campaign.contributions.length}`);
      console.log(`Milestones: ${campaign.milestones.length}\n`);

      campaign.contributions.forEach((c, idx) => {
        console.log(`  ${idx + 1}. $${c.amount} - ${c.transactionHash ? 'Blockchain ✅' : 'No TX ❌'}`);
      });

      console.log('\n  Milestone Status:');
      campaign.milestones.forEach((m, idx) => {
        console.log(`  ${idx + 1}. ${m.title} - $${m.amount} (${m.status}) - Index: ${m.blockchainMilestoneIndex ?? 'null'}`);
      });
      console.log('');
    }

    console.log('\n🔗 V3 Contract Info:');
    console.log('Address: 0xAEC2007a4C54E23fDa570281346b9b070661DaBB');
    console.log('Network: Tenderly VTN');
    console.log('\n⚠️ ISSUE:');
    console.log('Database campaigns were created BEFORE V3 deployment.');
    console.log('Their contributions went to V1/V2 contracts, not V3.');
    console.log('V3 contract has its own test milestones (3000/4000/3000 POL).\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContributionMismatch();
