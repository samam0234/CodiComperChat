-- 웹툰 오퍼레이션: 웹툰(콘티)과 컷
-- CreateTable
CREATE TABLE "webtoons" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "rating" TEXT NOT NULL DEFAULT 'sfw',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webtoons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webtoon_panels" (
    "id" TEXT NOT NULL,
    "webtoonId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "plan" JSONB NOT NULL,
    "caption" TEXT NOT NULL,
    "lines" JSONB NOT NULL DEFAULT '[]',
    "promptUsed" TEXT,
    "mime" TEXT,
    "data" BYTEA,
    "width" INTEGER,
    "height" INTEGER,
    "drawnAt" TIMESTAMP(3),

    CONSTRAINT "webtoon_panels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webtoons_campaignId_createdAt_idx" ON "webtoons"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "webtoon_panels_webtoonId_index_key" ON "webtoon_panels"("webtoonId", "index");

-- AddForeignKey
ALTER TABLE "webtoons" ADD CONSTRAINT "webtoons_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webtoon_panels" ADD CONSTRAINT "webtoon_panels_webtoonId_fkey" FOREIGN KEY ("webtoonId") REFERENCES "webtoons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

