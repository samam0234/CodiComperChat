-- CreateTable
CREATE TABLE "user_extras" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_extras" (
    "campaignId" TEXT NOT NULL,
    "extraId" TEXT NOT NULL,
    "triggers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_extras_pkey" PRIMARY KEY ("campaignId","extraId")
);

-- CreateIndex
CREATE INDEX "user_extras_userId_updatedAt_idx" ON "user_extras"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "user_extras" ADD CONSTRAINT "user_extras_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_extras" ADD CONSTRAINT "campaign_extras_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_extras" ADD CONSTRAINT "campaign_extras_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "user_extras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
