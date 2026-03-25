import 'dotenv/config';
import prisma from '../config/prisma.js';

// ── Category definitions per user's spec ─────────────────────
const COLD_PRESSED_OIL_NAMES = [
  'sesame oil', 'coconut oil', 'castor oil',
];

const ORGANIC_POWDERS_NAMES = [
  'dry ginger powder', 'ginger powder', 'shunti',
  'dry garlic powder', 'garlic powder', 'garlic peels', 'garlic ghee',
  'fenugreek powder', 'fenugreek', 'methi',
  'turmeric powder', 'turmeric',
  'aliv seeds', 'haliv',
  'chickpea powder',
  'neem powder',
  'soapnut',
  'palm jaggery',
  'ayurvedic shampoo',
  'badam powder',
  'moringa powder',
];

const HOMEMADE_PUDI_NAMES = [
  'curry leaf chutney', 'curry leaf',
  'methi chutney pudi', 'fenugreek chutney',
  'pepper rasam', 'rasam powder',
  'dill leaf chutney', 'dill leaf',
  'moringa chutney',
  'ajwain chutney', 'ajwain',
  'bananthi laddu', 'laddu',
  'rasam powder',
  'garlic chutney pudi', 'garlic chutney',
  'ginger jaggery laddu', 'ginger ball',
  'bananthi lehya', 'lehya',
  'digestion powder',
  'warm up powder',
];

function resolveCategory(name) {
  const n = name.toLowerCase();

  if (COLD_PRESSED_OIL_NAMES.some(k => n.includes(k))) {
    return 'Cold Pressed Oil';
  }
  if (ORGANIC_POWDERS_NAMES.some(k => n.includes(k))) {
    return 'Organic Powders';
  }
  if (HOMEMADE_PUDI_NAMES.some(k => n.includes(k))) {
    return 'Homemade Pudi';
  }
  return 'Other';
}

async function updateCategories() {
  const products = await prisma.product.findMany({ select: { id: true, name: true, category: true } });
  console.log(`Updating categories for ${products.length} products…`);

  let changed = 0;
  for (const p of products) {
    const newCat = resolveCategory(p.name);
    if (p.category !== newCat) {
      await prisma.product.update({ where: { id: p.id }, data: { category: newCat } });
      console.log(`  ${p.name}  →  ${newCat}  (was: ${p.category})`);
      changed++;
    }
  }
  console.log(`\nDone. ${changed} product(s) updated.`);
}

updateCategories()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
