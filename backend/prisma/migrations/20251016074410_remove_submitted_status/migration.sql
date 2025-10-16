/*
  Warnings:

  - The values [SUBMITTED] on the enum `MilestoneStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MilestoneStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'VOTING', 'APPROVED', 'REJECTED', 'EXPIRED', 'DISPUTED');
ALTER TABLE "public"."milestones" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "milestones" ALTER COLUMN "status" TYPE "MilestoneStatus_new" USING ("status"::text::"MilestoneStatus_new");
ALTER TYPE "MilestoneStatus" RENAME TO "MilestoneStatus_old";
ALTER TYPE "MilestoneStatus_new" RENAME TO "MilestoneStatus";
DROP TYPE "public"."MilestoneStatus_old";
ALTER TABLE "milestones" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
