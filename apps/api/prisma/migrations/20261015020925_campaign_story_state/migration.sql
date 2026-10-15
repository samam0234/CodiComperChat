-- AlterTable
ALTER TABLE "campaign_states" ADD COLUMN     "autoRelationship" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "closedEvents" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "digestedUntil" TIMESTAMP(3),
ADD COLUMN     "relationshipLog" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "relationshipReason" TEXT;
