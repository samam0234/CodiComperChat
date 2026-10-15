-- CreateEnum
CREATE TYPE "PortraitReview" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- AlterTable
ALTER TABLE "character_drafts" ADD COLUMN     "portraitReview" "PortraitReview",
ADD COLUMN     "portraitReviewNote" TEXT;

-- 검수 도입 전에 올린 초상은 이미 공개돼 있었으므로 승인된 것으로 본다
UPDATE "character_drafts" SET "portraitReview" = 'APPROVED' WHERE "portrait" IS NOT NULL;
