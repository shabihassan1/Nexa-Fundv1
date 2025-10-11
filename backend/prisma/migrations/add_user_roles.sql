-- Add role and permissions columns to users table
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'BACKER';
ALTER TABLE "users" ADD COLUMN "permissions" TEXT[] DEFAULT '{}';

-- Add approval fields to campaigns table
ALTER TABLE "campaigns" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "campaigns" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "approvedBy" TEXT;

-- Create enum types
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CREATOR', 'BACKER', 'MODERATOR');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- Update columns to use enums
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "campaigns" ALTER COLUMN "approvalStatus" TYPE "ApprovalStatus" USING "approvalStatus"::"ApprovalStatus";

-- Add foreign key for approver
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approvedBy_fkey" 
FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; 