-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "isBestseller" BOOLEAN NOT NULL DEFAULT false;
