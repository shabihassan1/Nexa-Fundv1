import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function checkSolarCampaign() {
  const campaign = await prisma.campaign.findFirst({
    where: { title: { contains: 'Library' } },
    include: {
      contributions: { where: { status: 'CONFIRMED' } },
      milestones: { orderBy: { order: 'asc' } }
    }
  });

  if (!campaign) {
    console.log('❌ Solar campaign not found');
    return;
  }

  console.log('📊 Campaign:', campaign.title);
  console.log('requiresMilestones:', campaign.requiresMilestones);
  console.log('currentAmount:', campaign.currentAmount);
  console.log('Contributions:', campaign.contributions.length);
  
  let totalContrib = 0;
  campaign.contributions.forEach(c => {
    totalContrib += parseFloat(c.amount.toString());
    console.log(`  - $${c.amount} (${c.status})`);
  });
  console.log('Total contributions:', totalContrib);

  console.log('\nMilestones:');
  campaign.milestones.forEach(m => {
    console.log(`  ${m.order}. ${m.title} - $${m.currentAmount}/$${m.amount} (${m.status})`);
  });

  await prisma.$disconnect();
}

checkSolarCampaign();
