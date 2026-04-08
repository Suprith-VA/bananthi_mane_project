/**
 * clearTestOrders.js
 * Deletes ALL orders (and their items) from the database.
 * Also restores all product variant stock to their seeded levels.
 * Run against Neon (production) as a one-time cleanup before launch.
 *
 * Usage:
 *   cd server && node --experimental-vm-modules scripts/clearTestOrders.js
 *   or via package.json script.
 */

import prisma from '../config/prisma.js';

async function clearTestOrders() {
  console.log('=== Clear Test Orders ===\n');

  // 1. Count before delete
  const orderCount = await prisma.order.count();
  const itemCount = await prisma.orderItem.count();
  console.log(`Found ${orderCount} order(s) and ${itemCount} order item(s).`);

  if (orderCount === 0) {
    console.log('Nothing to delete. Exiting.');
    return;
  }

  // 2. Delete all order items first (FK constraint), then orders
  const deletedItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${deletedItems.count} order item(s).`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`Deleted ${deletedOrders.count} order(s).`);

  // 3. Resync all product stockQuantity = SUM of variant stocks
  // (orders may have decremented stock; this resets to source-of-truth)
  const products = await prisma.product.findMany({ include: { variants: true } });
  let synced = 0;
  for (const p of products) {
    if (p.variants.length === 0) continue;
    const variantTotal = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
    if (p.stockQuantity !== variantTotal) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stockQuantity: variantTotal },
      });
      console.log(`  Stock resynced for "${p.name}": ${p.stockQuantity} → ${variantTotal}`);
      synced++;
    }
  }

  console.log(`\nStock resynced for ${synced} product(s).`);
  console.log('\n✅ All test orders cleared. Database is clean for production.');
}

clearTestOrders()
  .catch((err) => { console.error('Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
