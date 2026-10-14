-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "character_drafts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "card" JSONB NOT NULL,
    "lastTest" JSONB,
    "characterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "character_drafts_characterId_key" ON "character_drafts"("characterId");

-- CreateIndex
CREATE INDEX "character_drafts_ownerId_updatedAt_idx" ON "character_drafts"("ownerId", "updatedAt");

-- AddForeignKey
ALTER TABLE "character_drafts" ADD CONSTRAINT "character_drafts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_drafts" ADD CONSTRAINT "character_drafts_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
