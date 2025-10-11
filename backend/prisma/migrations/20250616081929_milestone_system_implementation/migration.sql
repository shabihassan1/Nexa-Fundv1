/*
  Warnings:

  - You are about to drop the column `isCompleted` on the `milestones` table. All the data in the column will be lost.
  - Added the required column `order` to the `milestones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VOTING', 'APPROVED', 'REJECTED', 'EXPIRED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "EscrowTransactionType" AS ENUM ('DEPOSIT', 'RELEASE', 'REFUND', 'ADMIN_HOLD');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "CampaignStatus" ADD VALUE 'MILESTONE_REVIEW';

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "escrowAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "releasedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "requiresMilestones" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "contributions" ADD COLUMN     "isEscrowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "status" "ContributionStatus" NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "isCompleted",
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "evidence" JSONB,
ADD COLUMN     "order" INTEGER NOT NULL,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "votingDeadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "votes" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "votingPower" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "milestone_submissions" (
    "id" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "milestoneId" TEXT NOT NULL,

    CONSTRAINT "milestone_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "EscrowTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "executedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "milestoneId" TEXT,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "milestone_submissions" ADD CONSTRAINT "milestone_submissions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
