-- AlterTable
ALTER TABLE "character_drafts" ADD COLUMN     "portrait" BYTEA,
ADD COLUMN     "portraitMime" TEXT;

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "portrait" BYTEA,
ADD COLUMN     "portraitMime" TEXT;
