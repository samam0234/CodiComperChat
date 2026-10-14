-- DropIndex
DROP INDEX "campaigns_userId_characterId_idx";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "personaDescription" TEXT,
ADD COLUMN     "personaId" TEXT,
ADD COLUMN     "personaName" TEXT,
ADD COLUMN     "savedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "campaigns_userId_characterId_status_idx" ON "campaigns"("userId", "characterId", "status");
