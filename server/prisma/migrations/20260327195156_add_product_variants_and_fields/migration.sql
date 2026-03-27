-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "unitLabel" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "howToUse" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "keyBenefits" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shippingReturns" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 50,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
