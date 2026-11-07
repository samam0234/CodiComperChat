-- 직접 적은 장기 기억, 1:1 대화와 세계관 플레이의 때·곳
ALTER TABLE "memory_chunks" ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "campaign_states" ADD COLUMN "sceneTime" TEXT;
ALTER TABLE "campaign_states" ADD COLUMN "scenePlace" TEXT;

ALTER TABLE "world_plays" ADD COLUMN "sceneTime" TEXT;
ALTER TABLE "world_plays" ADD COLUMN "scenePlace" TEXT;
