import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function activateFirstMilestone() {
  try {
    // Find GreenSpace campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        title: {
          contains: 'GreenSpace'
        }
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!campaign) {
      console.log('❌ Campaign not found');
      return;
    }

    if (campaign.milestones.length === 0) {
      console.log('❌ No milestones found for campaign');
      return;
    }

    const firstMilestone = campaign.milestones[0];

    // Update first milestone to ACTIVE
    await prisma.milestone.update({
      where: { id: firstMilestone.id },
      data: { status: 'ACTIVE' }
    });

    console.log('✅ First milestone activated successfully!');
    console.log(`   Campaign: ${campaign.title}`);
    console.log(`   Milestone: ${firstMilestone.title}`);
    console.log(`   Status: ACTIVE`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateFirstMilestone();
