import prisma from '../config/prisma.js';

async function cleanupAndResync() {
  console.log('=== Cleanup stale orders & resync product stock ===\n');

  // 1. Delete order items without unitLabel (pre-variant era) and their parent orders
  const staleItems = await prisma.orderItem.findMany({
    where: { unitLabel: null },
    select: { orderId: true },
  });
  const staleOrderIds = [...new Set(staleItems.map(i => i.orderId))];

  if (staleOrderIds.length > 0) {
    console.log(`Deleting ${staleOrderIds.length} stale order(s) without variant data...`);
    await prisma.orderItem.deleteMany({ where: { orderId: { in: staleOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: staleOrderIds } } });
    console.log('  Done.\n');
  } else {
    console.log('No stale orders found.\n');
  }

  // 2. Resync every product's stockQuantity = SUM(variant stocks)
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  let synced = 0;
  for (const p of products) {
    if (p.variants.length === 0) continue;
    const variantTotal = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
    if (p.stockQuantity !== variantTotal) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stockQuantity: variantTotal },
      });
      console.log(`  Synced "${p.name}": ${p.stockQuantity} → ${variantTotal}`);
      synced++;
    }
  }

  console.log(`\nResynced ${synced} product(s). Done!`);
}

cleanupAndResync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
