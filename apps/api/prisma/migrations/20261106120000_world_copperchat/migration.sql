-- CreateEnum
CREATE TYPE "WorldMode" AS ENUM ('CHAT', 'VISUAL_NOVEL', 'NOVEL', 'MESSENGER');

-- CreateEnum
CREATE TYPE "WorldEventKind" AS ENUM ('LADDER', 'DICE', 'BOWLING', 'LOTTERY', 'MAZE');

-- CreateEnum
CREATE TYPE "WorldEventStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'EXPIRED');

-- AlterEnum
ALTER TYPE "ContentTarget" ADD VALUE 'WORLD';

-- AlterEnum
ALTER TYPE "CreditReason" ADD VALUE 'EVENT';

-- CreateTable
CREATE TABLE "worlds" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "oneLiner" TEXT NOT NULL DEFAULT '',
    "setting" TEXT NOT NULL DEFAULT '',
    "rules" TEXT NOT NULL DEFAULT '',
    "opening" TEXT NOT NULL DEFAULT '',
    "mode" "WorldMode" NOT NULL DEFAULT 'CHAT',
    "visibility" "CharacterVisibility" NOT NULL DEFAULT 'PRIVATE',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "map" BYTEA,
    "mapMime" TEXT,
    "mapReview" "PortraitReview" NOT NULL DEFAULT 'APPROVED',
    "takenDownAt" TIMESTAMP(3),
    "takedownReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worlds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_cast" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "characterId" TEXT,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "speech" TEXT NOT NULL DEFAULT '',
    "startPlace" TEXT NOT NULL DEFAULT '',
    "homePlace" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "world_cast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_places" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "world_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_parts" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "opening" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "world_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_images" (
    "id" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "character" TEXT NOT NULL DEFAULT '',
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "review" "PortraitReview" NOT NULL DEFAULT 'APPROVED',
    "reviewNote" TEXT,
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_plays" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "worldId" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "personaDescription" TEXT NOT NULL DEFAULT '',
    "partIndex" INTEGER NOT NULL DEFAULT 0,
    "finished" BOOLEAN NOT NULL DEFAULT false,
    "locations" JSONB NOT NULL DEFAULT '{}',
    "turns" INTEGER NOT NULL DEFAULT 0,
    "turnsSinceEvent" INTEGER NOT NULL DEFAULT 0,
    "eventNote" TEXT,
    "storySoFar" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "world_plays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_messages" (
    "id" TEXT NOT NULL,
    "playId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "imageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "world_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "world_events" (
    "id" TEXT NOT NULL,
    "playId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "WorldEventKind" NOT NULL,
    "status" "WorldEventStatus" NOT NULL DEFAULT 'OPEN',
    "setup" JSONB NOT NULL,
    "outcome" JSONB,
    "reward" INTEGER NOT NULL DEFAULT 0,
    "rewarded" BOOLEAN NOT NULL DEFAULT false,
    "rewardDay" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "world_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "worlds_published_visibility_takenDownAt_idx" ON "worlds"("published", "visibility", "takenDownAt");

-- CreateIndex
CREATE INDEX "worlds_ownerId_idx" ON "worlds"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "world_cast_worldId_name_key" ON "world_cast"("worldId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "world_places_worldId_name_key" ON "world_places"("worldId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "world_parts_worldId_order_key" ON "world_parts"("worldId", "order");

-- CreateIndex
CREATE INDEX "world_images_review_idx" ON "world_images"("review");

-- CreateIndex
CREATE UNIQUE INDEX "world_images_worldId_label_key" ON "world_images"("worldId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "world_plays_userId_worldId_key" ON "world_plays"("userId", "worldId");

-- CreateIndex
CREATE INDEX "world_messages_playId_createdAt_idx" ON "world_messages"("playId", "createdAt");

-- CreateIndex
CREATE INDEX "world_events_userId_rewardDay_idx" ON "world_events"("userId", "rewardDay");

-- CreateIndex
CREATE INDEX "world_events_status_createdAt_idx" ON "world_events"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "worlds" ADD CONSTRAINT "worlds_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_cast" ADD CONSTRAINT "world_cast_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_cast" ADD CONSTRAINT "world_cast_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_places" ADD CONSTRAINT "world_places_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_parts" ADD CONSTRAINT "world_parts_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_images" ADD CONSTRAINT "world_images_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_plays" ADD CONSTRAINT "world_plays_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_plays" ADD CONSTRAINT "world_plays_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "worlds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_messages" ADD CONSTRAINT "world_messages_playId_fkey" FOREIGN KEY ("playId") REFERENCES "world_plays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "world_events" ADD CONSTRAINT "world_events_playId_fkey" FOREIGN KEY ("playId") REFERENCES "world_plays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

