-- DropForeignKey
ALTER TABLE "payment_orders" DROP CONSTRAINT "payment_orders_userId_fkey";

-- AlterTable
ALTER TABLE "payment_orders" ADD COLUMN     "buyerEmail" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 이미 있는 주문에도 구매자 이메일을 채운다
UPDATE "payment_orders" o SET "buyerEmail" = u."email" FROM "users" u WHERE o."userId" = u."id" AND o."buyerEmail" IS NULL;
