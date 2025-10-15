# Fix Existing Milestones for New Voting System

This script updates old milestones to be compatible with the new milestone voting system.

## Problem
Milestones created before the voting system implementation are missing required fields:
- `voteStartTime` - When voting period opened
- `voteEndTime` - When voting period closes
- `blockchainMilestoneIndex` - Index in smart contract
- `releaseTransactionHash` - Transaction hash for fund releases

## Solution
Run these SQL queries in sequence to fix existing milestones.

---

## Step 1: Check Current Milestones

```sql
-- View all milestones and their current state
SELECT 
  m.id, 
  m.title, 
  m."order", 
  m.status, 
  m.deadline,
  m."voteStartTime",
  m."voteEndTime",
  m."blockchainMilestoneIndex",
  c.title as campaign_title,
  c."activeMilestoneId"
FROM "Milestone" m
JOIN "Campaign" c ON m."campaignId" = c.id
ORDER BY c.id, m."order";
```

---

## Step 2: Identify Problematic Milestones

```sql
-- Find milestones that might have issues
SELECT 
  m.id,
  m.title,
  m.status,
  m."order",
  c.title as campaign,
  c."activeMilestoneId",
  CASE 
    WHEN m.status = 'VOTING' AND m."voteStartTime" IS NULL THEN '⚠️ VOTING but no voteStartTime'
    WHEN m.status = 'VOTING' AND m."voteEndTime" IS NULL THEN '⚠️ VOTING but no voteEndTime'
    WHEN m.status = 'APPROVED' AND m."releaseTransactionHash" IS NULL THEN '⚠️ APPROVED but no TX hash'
    WHEN m.status = 'ACTIVE' AND c."activeMilestoneId" IS NULL THEN '⚠️ ACTIVE but not set in campaign'
    WHEN c."activeMilestoneId" = m.id AND m.status != 'ACTIVE' THEN '⚠️ Set as active but status is not ACTIVE'
    ELSE '✅ OK'
  END as issue
FROM "Milestone" m
JOIN "Campaign" c ON m."campaignId" = c.id
ORDER BY c.id, m."order";
```

---

## Step 3: Fix Missing Active Milestone References

```sql
-- Update campaigns to point to their first PENDING milestone
-- (This activates the first milestone when campaign is funded)
UPDATE "Campaign" c
SET "activeMilestoneId" = (
  SELECT m.id 
  FROM "Milestone" m 
  WHERE m."campaignId" = c.id 
    AND m."order" = 1
  LIMIT 1
)
WHERE c."requiresMilestones" = true
  AND c.status = 'FUNDING'
  AND c."activeMilestoneId" IS NULL;
```

---

## Step 4: Activate First Milestone for Funded Campaigns

```sql
-- For campaigns that have received contributions,
-- activate the first milestone if it's still PENDING
UPDATE "Milestone" m
SET status = 'ACTIVE'
FROM "Campaign" c
WHERE m."campaignId" = c.id
  AND m."order" = 1
  AND m.status = 'PENDING'
  AND c."currentAmount" > 0
  AND c."requiresMilestones" = true;
```

---

## Step 5: Update Campaign Active Milestone Reference

```sql
-- After activating first milestones, update campaign references
UPDATE "Campaign" c
SET "activeMilestoneId" = (
  SELECT m.id 
  FROM "Milestone" m 
  WHERE m."campaignId" = c.id 
    AND m.status = 'ACTIVE'
  ORDER BY m."order"
  LIMIT 1
)
WHERE c."requiresMilestones" = true
  AND c.status = 'FUNDING'
  AND EXISTS (
    SELECT 1 FROM "Milestone" m 
    WHERE m."campaignId" = c.id 
      AND m.status = 'ACTIVE'
  );
```

---

## Step 6: Fix VOTING Milestones Without Timestamps

```sql
-- Set voting timestamps for milestones in VOTING status
-- (Assume voting started when they were submitted or now)
UPDATE "Milestone"
SET 
  "voteStartTime" = COALESCE("submittedAt", NOW()),
  "voteEndTime" = COALESCE("submittedAt", NOW()) + INTERVAL '7 days'
WHERE status = 'VOTING'
  AND "voteStartTime" IS NULL;
```

---

## Step 7: Assign Blockchain Milestone Indexes

```sql
-- Assign blockchain milestone indexes based on order
-- This should match the order in the smart contract
UPDATE "Milestone" m
SET "blockchainMilestoneIndex" = m."order" - 1  -- Smart contract uses 0-based indexing
FROM "Campaign" c
WHERE m."campaignId" = c.id
  AND c."requiresMilestones" = true
  AND m."blockchainMilestoneIndex" IS NULL;
```

---

## Step 8: Verify Fixes

```sql
-- Check all milestones after fixes
SELECT 
  c.title as campaign,
  m.title as milestone,
  m."order",
  m.status,
  m."blockchainMilestoneIndex",
  CASE 
    WHEN c."activeMilestoneId" = m.id THEN '🎯 ACTIVE IN CAMPAIGN'
    ELSE ''
  END as is_active,
  CASE 
    WHEN m."voteStartTime" IS NOT NULL THEN '✅ Has vote start'
    ELSE ''
  END as has_vote_start,
  CASE 
    WHEN m."voteEndTime" IS NOT NULL THEN '✅ Has vote end'
    ELSE ''
  END as has_vote_end
FROM "Campaign" c
JOIN "Milestone" m ON c.id = m."campaignId"
WHERE c."requiresMilestones" = true
ORDER BY c.id, m."order";
```

---

## Step 9: Check Contribution-Milestone Links

```sql
-- Verify contributions are linked to correct milestones
SELECT 
  c.title as campaign,
  contrib."userId",
  contrib.amount,
  contrib."milestoneId",
  m.title as milestone_title,
  m.status as milestone_status
FROM "Contribution" contrib
JOIN "Campaign" c ON contrib."campaignId" = c.id
LEFT JOIN "Milestone" m ON contrib."milestoneId" = m.id
WHERE c."requiresMilestones" = true
ORDER BY c.id, contrib."createdAt";
```

---

## Step 10: Link Orphaned Contributions to Active Milestone

```sql
-- Update contributions without milestoneId to link to active milestone
UPDATE "Contribution" contrib
SET "milestoneId" = c."activeMilestoneId"
FROM "Campaign" c
WHERE contrib."campaignId" = c.id
  AND contrib."milestoneId" IS NULL
  AND c."activeMilestoneId" IS NOT NULL
  AND c."requiresMilestones" = true;
```

---

## Alternative: Reset Milestones to Clean State (DESTRUCTIVE)

⚠️ **USE ONLY IF YOU WANT TO START FRESH**

```sql
-- This will reset all milestones to PENDING and clear voting data
-- Use this if you want to test the system from scratch

BEGIN;

-- Clear active milestone references
UPDATE "Campaign" 
SET "activeMilestoneId" = NULL
WHERE "requiresMilestones" = true;

-- Reset all milestones to PENDING
UPDATE "Milestone"
SET 
  status = 'PENDING',
  "voteStartTime" = NULL,
  "voteEndTime" = NULL,
  "submittedAt" = NULL,
  "approvedAt" = NULL,
  "rejectedAt" = NULL,
  "releaseTransactionHash" = NULL,
  "votesFor" = 0,
  "votesAgainst" = 0,
  "votingDeadline" = NULL;

-- Assign blockchain indexes
UPDATE "Milestone" m
SET "blockchainMilestoneIndex" = m."order" - 1
FROM "Campaign" c
WHERE m."campaignId" = c.id
  AND c."requiresMilestones" = true;

-- Activate first milestone for funded campaigns
UPDATE "Milestone" m
SET status = 'ACTIVE'
FROM "Campaign" c
WHERE m."campaignId" = c.id
  AND m."order" = 1
  AND c."currentAmount" > 0
  AND c."requiresMilestones" = true;

-- Update campaign active milestone references
UPDATE "Campaign" c
SET "activeMilestoneId" = (
  SELECT m.id 
  FROM "Milestone" m 
  WHERE m."campaignId" = c.id 
    AND m.status = 'ACTIVE'
  ORDER BY m."order"
  LIMIT 1
)
WHERE c."requiresMilestones" = true
  AND EXISTS (
    SELECT 1 FROM "Milestone" m 
    WHERE m."campaignId" = c.id 
      AND m.status = 'ACTIVE'
  );

-- Clear all milestone votes
DELETE FROM "MilestoneVote";

COMMIT;
```

---

## How to Run These Queries

### Option 1: Using Prisma Studio (GUI)
1. Open Prisma Studio: `npx prisma studio` (already running on port 5555)
2. Navigate to the model you want to update
3. Manually edit records
4. **NOT RECOMMENDED** for bulk updates

### Option 2: Using psql (PostgreSQL CLI)
```powershell
# Connect to your Neon database
psql "postgresql://neondb_owner:PASSWORD@HOST/neondb?sslmode=require"

# Then paste queries one by one
```

### Option 3: Using Prisma Client (Recommended)
Create a script file:

```typescript
// backend/src/scripts/fixMilestones.ts
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function fixExistingMilestones() {
  console.log('🔧 Fixing existing milestones...\n');

  // Step 1: Check current state
  console.log('📊 Step 1: Checking current milestones...');
  const milestones = await prisma.milestone.findMany({
    include: {
      campaign: {
        select: {
          title: true,
          activeMilestoneId: true,
          requiresMilestones: true,
          status: true,
          currentAmount: true,
        },
      },
    },
    orderBy: [
      { campaignId: 'asc' },
      { order: 'asc' },
    ],
  });

  console.log(`Found ${milestones.length} milestones\n`);

  // Step 2: Assign blockchain indexes
  console.log('🔗 Step 2: Assigning blockchain milestone indexes...');
  for (const milestone of milestones) {
    if (milestone.blockchainMilestoneIndex === null) {
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          blockchainMilestoneIndex: milestone.order - 1, // 0-based indexing
        },
      });
      console.log(`✅ Assigned index ${milestone.order - 1} to "${milestone.title}"`);
    }
  }

  // Step 3: Activate first milestone for funded campaigns
  console.log('\n🎯 Step 3: Activating first milestones for funded campaigns...');
  const fundedCampaigns = await prisma.campaign.findMany({
    where: {
      requiresMilestones: true,
      status: 'FUNDING',
      currentAmount: { gt: 0 },
    },
    include: {
      milestones: {
        orderBy: { order: 'asc' },
      },
    },
  });

  for (const campaign of fundedCampaigns) {
    const firstMilestone = campaign.milestones[0];
    if (firstMilestone && firstMilestone.status === 'PENDING') {
      await prisma.milestone.update({
        where: { id: firstMilestone.id },
        data: { status: 'ACTIVE' },
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { activeMilestoneId: firstMilestone.id },
      });

      console.log(`✅ Activated milestone "${firstMilestone.title}" for campaign "${campaign.title}"`);
    }
  }

  // Step 4: Fix VOTING milestones without timestamps
  console.log('\n⏰ Step 4: Fixing VOTING milestones without timestamps...');
  const votingMilestones = await prisma.milestone.findMany({
    where: {
      status: 'VOTING',
      voteStartTime: null,
    },
  });

  for (const milestone of votingMilestones) {
    const startTime = milestone.submittedAt || new Date();
    const endTime = new Date(startTime);
    endTime.setDate(endTime.getDate() + 7); // 7 days voting period

    await prisma.milestone.update({
      where: { id: milestone.id },
      data: {
        voteStartTime: startTime,
        voteEndTime: endTime,
      },
    });

    console.log(`✅ Set voting period for "${milestone.title}": ${startTime.toISOString()} to ${endTime.toISOString()}`);
  }

  // Step 5: Link orphaned contributions
  console.log('\n🔗 Step 5: Linking contributions to active milestones...');
  const orphanedContributions = await prisma.contribution.findMany({
    where: {
      milestoneId: null,
      campaign: {
        requiresMilestones: true,
        activeMilestoneId: { not: null },
      },
    },
    include: {
      campaign: {
        select: {
          activeMilestoneId: true,
          title: true,
        },
      },
    },
  });

  for (const contribution of orphanedContributions) {
    if (contribution.campaign.activeMilestoneId) {
      await prisma.contribution.update({
        where: { id: contribution.id },
        data: { milestoneId: contribution.campaign.activeMilestoneId },
      });
      console.log(`✅ Linked contribution of $${contribution.amount} to active milestone`);
    }
  }

  // Final verification
  console.log('\n✅ Step 6: Verification...');
  const fixedMilestones = await prisma.milestone.findMany({
    include: {
      campaign: {
        select: {
          title: true,
          activeMilestoneId: true,
        },
      },
    },
    orderBy: [
      { campaignId: 'asc' },
      { order: 'asc' },
    ],
  });

  console.log('\n📊 Final Status:');
  for (const milestone of fixedMilestones) {
    const isActive = milestone.campaign.activeMilestoneId === milestone.id ? '🎯 ACTIVE' : '';
    console.log(
      `${milestone.campaign.title} - Milestone #${milestone.order}: ${milestone.title} [${milestone.status}] ${isActive}`
    );
  }

  console.log('\n✅ Migration complete!');
}

fixExistingMilestones()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Then run:
```powershell
cd backend
npx ts-node src/scripts/fixMilestones.ts
```

---

## Expected Results

After running the fixes:

✅ All milestones have `blockchainMilestoneIndex` assigned (0, 1, 2, etc.)  
✅ First milestone of funded campaigns is ACTIVE  
✅ Campaign `activeMilestoneId` points to correct milestone  
✅ VOTING milestones have `voteStartTime` and `voteEndTime`  
✅ Contributions are linked to their respective milestones  
✅ System ready for milestone voting flow

---

## Troubleshooting

### Issue: "No milestones found"
**Solution:** Run Step 1 query to check if milestones exist in database

### Issue: BackingModal shows "No active milestone"
**Solution:** 
1. Check campaign has `requiresMilestones = true`
2. Check campaign has `activeMilestoneId` set
3. Check milestone with that ID has `status = 'ACTIVE'`

### Issue: Contributions not linked to milestone
**Solution:** Run Step 10 to link orphaned contributions

### Issue: Voting stats showing 0/0
**Solution:** Check milestone has `blockchainMilestoneIndex` assigned

---

## Quick Fix Command (All-in-One)

For a quick fix, run this single script:

```powershell
cd backend
npx ts-node src/scripts/fixMilestones.ts
```

This will automatically:
1. Assign blockchain indexes
2. Activate first milestones
3. Fix voting timestamps
4. Link contributions
5. Verify results
