-- AlterTable
ALTER TABLE "users" ADD COLUMN     "fundingPreference" TEXT,
ADD COLUMN     "interestKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "locationPreference" TEXT,
ADD COLUMN     "preferencesSet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "riskTolerance" TEXT;
