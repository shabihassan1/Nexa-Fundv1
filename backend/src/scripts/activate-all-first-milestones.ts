import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function activateAllFirstMilestones() {
  try {
    console.log('🔍 Searching for campaigns with PENDING first milestones...\n');

    // Find all campaigns with milestones
    const campaigns = await prisma.campaign.findMany({
      include: {
        milestones: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (campaigns.length === 0) {
      console.log('❌ No campaigns found');
      return;
    }

    let activatedCount = 0;
    let alreadyActiveCount = 0;
    let noMilestonesCount = 0;

    for (const campaign of campaigns) {
      if (campaign.milestones.length === 0) {
        console.log(`⏭️  Skipping "${campaign.title}" - No milestones`);
        noMilestonesCount++;
        continue;
      }

      const firstMilestone = campaign.milestones[0];

      if (firstMilestone.status === 'ACTIVE') {
        console.log(`✓ "${campaign.title}" - First milestone already ACTIVE`);
        alreadyActiveCount++;
        continue;
      }

      // Update first milestone to ACTIVE
      await prisma.milestone.update({
        where: { id: firstMilestone.id },
        data: { status: 'ACTIVE' }
      });

      console.log(`✅ ACTIVATED: "${campaign.title}"`);
      console.log(`   Milestone: ${firstMilestone.title}`);
      console.log(`   Status: PENDING → ACTIVE\n`);
      activatedCount++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Total Campaigns: ${campaigns.length}`);
    console.log(`   ✅ Activated: ${activatedCount}`);
    console.log(`   ✓ Already Active: ${alreadyActiveCount}`);
    console.log(`   ⏭️  No Milestones: ${noMilestonesCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAllFirstMilestones();
