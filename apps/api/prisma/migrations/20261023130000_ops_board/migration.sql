-- CreateEnum
CREATE TYPE "BoardAuthor" AS ENUM ('USER', 'RESIDENT');

-- CreateTable
CREATE TABLE "board_posts" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "authorKind" "BoardAuthor" NOT NULL,
    "authorName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorKind" "BoardAuthor" NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_posts_campaignId_createdAt_idx" ON "board_posts"("campaignId", "createdAt");

-- CreateIndex
CREATE INDEX "board_comments_postId_createdAt_idx" ON "board_comments"("postId", "createdAt");

-- AddForeignKey
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_comments" ADD CONSTRAINT "board_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "board_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
