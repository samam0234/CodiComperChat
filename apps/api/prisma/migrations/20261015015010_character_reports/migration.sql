-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "takedownReason" TEXT,
ADD COLUMN     "takenDownAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "character_reports" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "character_reports_status_createdAt_idx" ON "character_reports"("status", "createdAt");

-- CreateIndex
CREATE INDEX "character_reports_characterId_status_idx" ON "character_reports"("characterId", "status");

-- AddForeignKey
ALTER TABLE "character_reports" ADD CONSTRAINT "character_reports_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_reports" ADD CONSTRAINT "character_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
