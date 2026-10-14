-- CreateEnum
CREATE TYPE "CharacterVisibility" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- AlterTable
ALTER TABLE "character_drafts" ADD COLUMN     "visibility" "CharacterVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "visibility" "CharacterVisibility" NOT NULL DEFAULT 'PUBLIC';

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
