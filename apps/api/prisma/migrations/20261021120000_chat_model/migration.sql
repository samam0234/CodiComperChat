-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "chatModel" TEXT NOT NULL DEFAULT 'basic';

-- CreateTable
CREATE TABLE "model_usage" (
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "model_usage_pkey" PRIMARY KEY ("userId","modelId","day")
);

-- CreateIndex
CREATE INDEX "model_usage_day_idx" ON "model_usage"("day");

-- AddForeignKey
ALTER TABLE "model_usage" ADD CONSTRAINT "model_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
