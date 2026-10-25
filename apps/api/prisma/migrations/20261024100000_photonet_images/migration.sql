-- CreateTable
CREATE TABLE "photonet_images" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptUsed" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "ratio" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photonet_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "photonet_images_campaignId_createdAt_idx" ON "photonet_images"("campaignId", "createdAt");

-- AddForeignKey
ALTER TABLE "photonet_images" ADD CONSTRAINT "photonet_images_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
