-- AlterEnum
ALTER TYPE "CreditReason" ADD VALUE 'OPERATION';

-- CreateTable
CREATE TABLE "mind_readings" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "innerVoice" TEXT NOT NULL,
    "feeling" TEXT NOT NULL,
    "aboutUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mind_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mind_readings_campaignId_createdAt_idx" ON "mind_readings"("campaignId", "createdAt");

-- AddForeignKey
ALTER TABLE "mind_readings" ADD CONSTRAINT "mind_readings_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
