-- AlterTable
ALTER TABLE "contributions" ADD COLUMN     "rewardTierId" TEXT;

-- CreateTable
CREATE TABLE "reward_tiers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minimumAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,

    CONSTRAINT "reward_tiers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reward_tiers" ADD CONSTRAINT "reward_tiers_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_rewardTierId_fkey" FOREIGN KEY ("rewardTierId") REFERENCES "reward_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
