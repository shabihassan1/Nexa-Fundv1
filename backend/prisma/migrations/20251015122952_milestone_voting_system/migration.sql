-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "activeMilestoneId" TEXT;

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "blockchainMilestoneIndex" INTEGER,
ADD COLUMN     "releaseTransactionHash" TEXT,
ADD COLUMN     "voteEndTime" TIMESTAMP(3),
ADD COLUMN     "voteStartTime" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_activeMilestoneId_fkey" FOREIGN KEY ("activeMilestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
