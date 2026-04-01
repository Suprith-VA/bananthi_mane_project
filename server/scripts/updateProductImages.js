/**
 * Update all product images to match the files in client/public/images/
 * Run: node scripts/updateProductImages.js
 */
import prisma from '../config/prisma.js';

const IMAGE_MAP = {
  'Ajwain Chutney Powder':   '/images/ajwan_chutney_powder.png',
  'Aliv Seeds Powder':       '/images/aliv_seed_powder.png',
  'Ayurvedic Shampoo':       '/images/ayurvedic_shampoo.png',
  'Badam Powder':            '/images/badam_powder.png',
  // 'Bananthi Laddu' — no matching image file; keeping current
  'Bananthi Lehya':          '/images/bananthi_lehya.png',
  'Castor Oil':              '/images/Castor_oil.png',
  'Chickpea Powder':         '/images/chikpea_powder.png',
  'Coconut Oil':             '/images/coconut_oil.png',
  'Curry Leaf Chutney Pudi': '/images/curry_leaf_chutney_pudi.png',
  'Dill Leaf Chutney Pudi':  '/images/dill_leaves_chutney_pudi.png',
  'Dry Garlic Powder':       '/images/dry_garlic_powder.png',
  'Dry Ginger Powder':       '/images/dry_ginger_powder.png',
  'Fenugreek Powder':        '/images/fenugreek_powder.png',
  'Garlic Chutney Pudi':     '/images/garlic_chutney_pudi.png',
  'Ginger Jaggery Laddu':   '/images/ginger_jaggery_laddu.png',
  'Methi Chutney Pudi':      '/images/methi_chutney_pudi.png',
  'Moringa Chutney Pudi':    '/images/moringa_chutney_pudi.png',
  'Neem Powder':             '/images/Neem_paste.png',
  'Palm Jaggery':            '/images/Palm_Jaggery.png',
  'Pepper Rasam Powder':     '/images/pepper_rasam_powder.png',
  'Rasam Powder':            '/images/rasam_powder.png',
  'Sesame Oil':              '/images/Seseme_Oil.png',
  'Soapnut Powder':          '/images/soapnut_powder.png',
  'Turmeric Powder':         '/images/turmeric_powder.png',
};

async function main() {
  console.log('🖼️  Updating product images...\n');

  const products = await prisma.product.findMany({ where: { isActive: true } });
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const correctImage = IMAGE_MAP[product.name];
    if (!correctImage) {
      console.log(`⏭️  SKIP: "${product.name}" — no mapping defined`);
      skipped++;
      continue;
    }

    const needsUpdate =
      product.image !== correctImage ||
      !product.images.includes(correctImage) ||
      product.images.length !== 1;

    if (!needsUpdate) {
      console.log(`✅ OK:   "${product.name}" — already correct`);
      continue;
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        image: correctImage,
        images: [correctImage],
      },
    });

    console.log(`🔄 UPD:  "${product.name}" → ${correctImage}`);
    updated++;
  }

  console.log(`\n✨ Done. Updated: ${updated}, Skipped: ${skipped}, Already correct: ${products.length - updated - skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
