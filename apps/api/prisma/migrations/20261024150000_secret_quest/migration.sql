-- 비밀 퀘스트: 캐릭터의 퀘스트 정의, 대화별 진행, 코레딧 보상 기록
ALTER TYPE "CreditReason" ADD VALUE IF NOT EXISTS 'QUEST';

ALTER TABLE "characters" ADD COLUMN "quest" JSONB;
ALTER TABLE "campaign_states" ADD COLUMN "questState" JSONB;

CREATE TABLE "quest_rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_rewards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quest_rewards_userId_characterId_key" ON "quest_rewards"("userId", "characterId");

ALTER TABLE "quest_rewards" ADD CONSTRAINT "quest_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
