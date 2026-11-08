-- CreateEnum
CREATE TYPE "SupportInquiryStatus" AS ENUM ('OPEN', 'ANSWERED');

-- CreateTable
CREATE TABLE "support_inquiries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "SupportInquiryStatus" NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_inquiries_status_createdAt_idx" ON "support_inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "support_inquiries_userId_createdAt_idx" ON "support_inquiries"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "support_inquiries" ADD CONSTRAINT "support_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
