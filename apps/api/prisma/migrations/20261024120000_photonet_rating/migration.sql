-- AlterTable
ALTER TABLE "users" ADD COLUMN     "adultConsentAt" TIMESTAMP(3),
ADD COLUMN     "birthDate" DATE;

-- AlterTable
ALTER TABLE "photonet_images" ADD COLUMN     "rating" TEXT NOT NULL DEFAULT 'sfw';
