import prisma from '../config/database';

async function checkUnfundedCampaigns() {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Campaigns with Milestones (Unfunded/Partially Funded):\n');

    for (const campaign of campaigns) {
      if (campaign.milestones.length > 0) {
        const fundedPercentage = (campaign.currentAmount / campaign.targetAmount) * 100;
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Campaign: ${campaign.title}`);
        console.log(`ID: ${campaign.id}`);
        console.log(`Goal: $${campaign.targetAmount} | Funded: $${campaign.currentAmount} (${fundedPercentage.toFixed(1)}%)`);
        console.log(`Milestones: ${campaign.milestones.length}`);
        console.log(`\nMilestone Breakdown:`);
        
        campaign.milestones.forEach((m, idx) => {
          console.log(`  ${idx + 1}. ${m.title}`);
          console.log(`     Amount: $${m.amount} | Status: ${m.status}`);
          console.log(`     Funded: $${m.currentAmount}/${m.amount}`);
          if (m.description) {
            console.log(`     Description: ${m.description.substring(0, 100)}...`);
          }
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUnfundedCampaigns();
