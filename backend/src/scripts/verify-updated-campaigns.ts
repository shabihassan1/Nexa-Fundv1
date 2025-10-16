import prisma from '../config/database';

async function verifyUpdatedCampaigns() {
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

    console.log('\n📋 Updated Campaign Summary:\n');

    for (const campaign of campaigns) {
      if (campaign.milestones.length > 0) {
        const milestoneTotal = campaign.milestones.reduce((sum, m) => sum + m.amount, 0);
        const proofCount = campaign.milestones.filter(m => m.proofRequirements).length;
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Campaign: ${campaign.title}`);
        console.log(`Goal: $${campaign.targetAmount} | Milestones: ${campaign.milestones.length}`);
        console.log(`Milestone Total: $${milestoneTotal} | Match: ${milestoneTotal === campaign.targetAmount ? '✅' : '❌'}`);
        console.log(`Proof Requirements: ${proofCount}/${campaign.milestones.length} milestones`);
        
        campaign.milestones.forEach((m, idx) => {
          console.log(`\n  ${idx + 1}. ${m.title} - $${m.amount} (${m.status})`);
          if (m.description) {
            console.log(`     Description: ${m.description.substring(0, 80)}...`);
          }
          if (m.proofRequirements) {
            const proofPreview = m.proofRequirements.substring(0, 100);
            console.log(`     Proof: ${proofPreview}...`);
          }
        });
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('\n✅ Verification complete!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUpdatedCampaigns();
