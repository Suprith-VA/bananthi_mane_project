/**
 * Daily Order Digest — sends a summary of today's orders to sales@
 * 
 * Run manually:  node scripts/dailyOrderDigest.js
 * Or with cron:  0 23 * * * cd /path/to/server && node scripts/dailyOrderDigest.js
 */
import prisma from '../config/prisma.js';
import { sendDailyOrderDigestEmail } from '../services/emailService.js';

async function main() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const dateStr = startOfDay.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  console.log(`📊 Daily Digest: ${dateStr} — ${totalOrders} orders, ₹${totalRevenue.toFixed(2)}`);

  await sendDailyOrderDigestEmail({
    date: dateStr,
    totalOrders,
    totalRevenue,
    orders,
  });

  console.log('✅ Daily digest email sent');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
