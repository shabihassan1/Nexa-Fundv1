import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function fixSolarLibraryCampaign() {
  console.log('🔧 Fixing Solar-Powered Library campaign...\n');

  // 1. Find the campaign
  const campaign = await prisma.campaign.findFirst({
    where: { title: { contains: 'Library' } }
  });

  if (!campaign) {
    console.log('❌ Campaign not found');
    return;
  }

  // 2. Set requiresMilestones to true
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { requiresMilestones: true }
  });

  console.log('✅ Set requiresMilestones to true');

  // 2. Allocate the $50 to the first milestone
  const milestone = await prisma.milestone.updateMany({
    where: {
      campaignId: campaign.id,
      order: 1
    },
    data: { currentAmount: 50 }
  });

  console.log('✅ Allocated $50 to first milestone');

  // 3. Verify the update
  const updated = await prisma.campaign.findUnique({
    where: { id: campaign.id },
    include: { milestones: { orderBy: { order: 'asc' } } }
  });

  console.log('\n📊 Updated Campaign Status:');
  console.log(`Title: ${updated?.title}`);
  console.log(`requiresMilestones: ${updated?.requiresMilestones}`);
  console.log(`currentAmount: $${updated?.currentAmount}`);
  console.log('\nMilestones:');
  updated?.milestones.forEach(m => {
    const percentage = ((m.currentAmount / parseFloat(m.amount.toString())) * 100).toFixed(1);
    const isFunded = m.currentAmount >= parseFloat(m.amount.toString());
    console.log(`  ${isFunded ? '🎯' : '💰'} ${m.order}. ${m.title}`);
    console.log(`     $${m.currentAmount}/$${m.amount} (${percentage}%) - ${m.status} ${isFunded ? '✅ FULLY FUNDED' : ''}`);
  });

  await prisma.$disconnect();
  console.log('\n✅ Fix complete!');
}

fixSolarLibraryCampaign();
