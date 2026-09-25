-- CreateTable
CREATE TABLE "user_personas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_personas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_personas_userId_idx" ON "user_personas"("userId");

-- AddForeignKey
ALTER TABLE "user_personas" ADD CONSTRAINT "user_personas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
