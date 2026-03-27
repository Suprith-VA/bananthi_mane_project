import prisma from '../config/prisma.js';

const FINAL_PRODUCTS = [
  // ─── Cold Pressed Oil ───
  {
    name: 'Sesame Oil', category: 'Cold Pressed Oil',
    keyBenefits: 'Postnatal Massage, Nutritional Support, Encourages healing. Rich in natural antioxidants and minerals.',
    howToUse: 'Warm the oil slightly before use. Ideal for full-body postpartum massage. Can also be used in cooking for added nutrition.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 Ltr', price: 600, stockQuantity: 50 },
      { unitLabel: '500 ML', price: 310, stockQuantity: 50 },
      { unitLabel: '250 ML', price: 155, stockQuantity: 50 },
    ],
  },
  {
    name: 'Coconut Oil', category: 'Cold Pressed Oil',
    keyBenefits: 'Acts as a moisturizer and gives relief. Supports skin healing and hydration during postpartum recovery.',
    howToUse: 'Apply generously on skin or hair. Can be used for cooking, oil pulling, or as a natural moisturizer for mother and baby.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 Ltr', price: 700, stockQuantity: 50 },
      { unitLabel: '500 ML', price: 360, stockQuantity: 50 },
      { unitLabel: '250 ML', price: 180, stockQuantity: 50 },
    ],
  },
  {
    name: 'Castor Oil', category: 'Cold Pressed Oil',
    keyBenefits: 'Avoids Postpartum hair loss, improves circulation. Strengthens hair roots and promotes healthy regrowth.',
    howToUse: 'Massage into scalp 2-3 times a week. Leave for at least 30 minutes before washing. Can also be applied on skin for hydration.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 Ltr', price: 700, stockQuantity: 50 },
      { unitLabel: '500 ML', price: 360, stockQuantity: 50 },
      { unitLabel: '250 ML', price: 180, stockQuantity: 50 },
    ],
  },

  // ─── Organic Powders ───
  {
    name: 'Dry Ginger Powder', category: 'Organic Powders',
    keyBenefits: 'Dry Ginger Powder is very beneficial during postpartum period for its warming and restorative properties. Supports digestion and reduces inflammation.',
    howToUse: 'Add half a teaspoon to warm water, milk, or food. Ideal in postpartum kashayams, soups, and herbal drinks.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 550, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 400, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 285, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 145, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 75, stockQuantity: 50 },
    ],
  },
  {
    name: 'Dry Garlic Powder', category: 'Organic Powders',
    keyBenefits: 'Dry Garlic Powder supports lactation and general healing. Has natural antibacterial properties and boosts immunity.',
    howToUse: 'Sprinkle on food or add to warm water. Use in postpartum soups, dals, and rasam for enhanced flavor and health benefits.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 550, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 400, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 285, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 145, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 75, stockQuantity: 50 },
    ],
  },
  {
    name: 'Fenugreek Powder', category: 'Organic Powders',
    keyBenefits: 'Fenugreek powder is most widely used as a galactagogue to help increase breast milk supply. Rich in iron and calcium.',
    howToUse: 'Mix 1 teaspoon in warm water or milk. Best taken in the morning or added to postpartum foods like laddu and kashayam.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 550, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 400, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 285, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 145, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 75, stockQuantity: 50 },
    ],
  },
  {
    name: 'Turmeric Powder', category: 'Organic Powders',
    keyBenefits: 'Natural anti-inflammatory and antiseptic. Supports wound healing, boosts immunity, and improves skin health during postpartum recovery.',
    howToUse: 'Add to warm milk (golden milk), soups, or food. Can also be used in face packs for skin rejuvenation.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 500, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 370, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 260, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 130, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 65, stockQuantity: 50 },
    ],
  },
  {
    name: 'Aliv Seeds Powder', category: 'Organic Powders',
    keyBenefits: 'Highly nutritious for postpartum recovery due to dense nutrient profile, which includes iron, protein, calcium, and folate. Boosts energy and supports lactation.',
    howToUse: 'Soak half a spoon overnight. Mix with warm milk, jaggery, and dry fruits. Can also be added to laddus and porridge.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 500, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 370, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 260, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 130, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 65, stockQuantity: 50 },
    ],
  },
  {
    name: 'Chickpea Powder', category: 'Organic Powders',
    keyBenefits: 'Rich in plant-based protein (about 20g per cup), essential for repairing tissues and muscles after childbirth. Supports energy and recovery.',
    howToUse: 'Mix with water or milk to make a paste. Can be used in cooking, face packs, or as a protein supplement in postpartum diet.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 400, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 290, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 210, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 105, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 55, stockQuantity: 50 },
    ],
  },
  {
    name: 'Neem Powder', category: 'Organic Powders',
    keyBenefits: 'Neem powder is primarily used for its potent antiseptic and healing properties to support external recovery after childbirth. Natural blood purifier.',
    howToUse: 'Mix with water to make a paste for skin application. Can be added to bath water for antiseptic benefits. Not recommended for internal use during breastfeeding without consultation.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 450, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 330, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 235, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 120, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 60, stockQuantity: 50 },
    ],
  },
  {
    name: 'Soapnut Powder', category: 'Organic Powders',
    keyBenefits: 'Traditionally known as Reetha, highly valued during postpartum for its gentle, chemical-free properties that benefit both mothers and newborns. Natural cleanser.',
    howToUse: 'Mix with water to create a natural shampoo or body wash. Ideal for baby bath as well. Soak soapnuts overnight for best results.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 550, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 400, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 285, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 145, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 75, stockQuantity: 50 },
    ],
  },
  {
    name: 'Ayurvedic Shampoo', category: 'Organic Powders',
    keyBenefits: 'Natural herbal shampoo with no chemicals. Prevents postpartum hair loss, strengthens hair follicles, and promotes healthy scalp.',
    howToUse: 'Mix powder with water to form a paste. Apply on wet hair, massage gently, and rinse. Use 2-3 times a week for best results.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 400, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 340, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 240, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 120, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 75, stockQuantity: 50 },
    ],
  },
  {
    name: 'Palm Jaggery', category: 'Organic Powders',
    keyBenefits: 'Palm jaggery (Karupatti) is a traditional postpartum superfood. Mineral-dense and minimally processed, retains vital nutrients that help mothers recover from childbirth.',
    howToUse: 'Use as a natural sweetener in milk, tea, or postpartum foods. Can be eaten directly as a snack. Replace refined sugar with palm jaggery for all cooking.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '1 KG', price: 600, stockQuantity: 50 },
      { unitLabel: '800 Gms', price: 450, stockQuantity: 50 },
      { unitLabel: '500 Gms', price: 310, stockQuantity: 50 },
      { unitLabel: '250 Gms', price: 155, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 75, stockQuantity: 50 },
    ],
  },

  // ─── Homemade Pudi ───
  {
    name: 'Curry Leaf Chutney Pudi', category: 'Homemade Pudi',
    keyBenefits: 'Rich in iron and antioxidants. Curry leaves aid digestion, support lactation, and strengthen hair. A flavorful addition to postpartum meals.',
    howToUse: 'Mix with hot rice and a drizzle of ghee. Can also be used as a side with dosa, idli, or chapati.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 380, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 190, stockQuantity: 50 },
    ],
  },
  {
    name: 'Methi Chutney Pudi', category: 'Homemade Pudi',
    keyBenefits: 'Made with sprouted fenugreek and dry coconut. Supports breast milk production and aids digestion. Rich in fiber and minerals.',
    howToUse: 'Mix with hot rice and ghee. Perfect accompaniment to idli, dosa, or roti.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 290, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 145, stockQuantity: 50 },
    ],
  },
  {
    name: 'Pepper Rasam Powder', category: 'Homemade Pudi',
    keyBenefits: 'Made with black pepper, curry leaf, long pepper, ginger, garlic, and traditional spices. Excellent for boosting immunity and warming the body postpartum.',
    howToUse: 'Add 1-2 teaspoons to tamarind water with tomato and dal. Temper with ghee for a nourishing postpartum rasam.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 500, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 250, stockQuantity: 50 },
    ],
  },
  {
    name: 'Dill Leaf Chutney Pudi', category: 'Homemade Pudi',
    keyBenefits: 'Dill leaves are known to support lactation and digestion. Combined with dry coconut and spices for a wholesome postpartum condiment.',
    howToUse: 'Mix with hot rice and ghee. Ideal as a side dish with any South Indian meal.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 380, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 190, stockQuantity: 50 },
    ],
  },
  {
    name: 'Moringa Chutney Pudi', category: 'Homemade Pudi',
    keyBenefits: 'Moringa (drumstick leaves) is a superfood packed with iron, calcium, and vitamins. Excellent galactagogue that boosts breast milk supply naturally.',
    howToUse: 'Mix with hot rice and a generous amount of ghee. Can be sprinkled on dosa, idli, or mixed into curd rice.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 380, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 190, stockQuantity: 50 },
    ],
  },
  {
    name: 'Ajwain Chutney Powder', category: 'Homemade Pudi',
    keyBenefits: 'Made with Ajwain, dry coconut, jeera, and spices. Ajwain is excellent for postpartum digestion, reducing bloating, and supporting metabolism.',
    howToUse: 'Mix with hot rice and ghee. Great as a quick side with idli, dosa, or chapati.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 380, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 190, stockQuantity: 50 },
    ],
  },
  {
    name: 'Bananthi Laddu', category: 'Homemade Pudi',
    keyBenefits: 'Traditional postpartum laddu packed with dry fruits, nuts, and ghee. Provides sustained energy, supports lactation, and aids recovery.',
    howToUse: 'Eat 1-2 laddus daily as a nourishing snack. Best consumed with warm milk for enhanced benefits.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 470, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 235, stockQuantity: 50 },
    ],
  },
  {
    name: 'Badam Powder', category: 'Homemade Pudi',
    keyBenefits: 'Pure almond powder rich in protein, healthy fats, and vitamin E. Supports brain development in babies through breast milk and boosts maternal energy.',
    howToUse: 'Mix 1-2 teaspoons in warm milk with honey or jaggery. Can be added to smoothies, porridge, or postpartum laddus.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 420, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 210, stockQuantity: 50 },
    ],
  },
  {
    name: 'Rasam Powder', category: 'Homemade Pudi',
    keyBenefits: 'Traditional homemade rasam powder with a blend of cumin, coriander, pepper, and curry leaves. Aids digestion and keeps the body warm during recovery.',
    howToUse: 'Add 1-2 teaspoons to tamarind and tomato water. Temper with ghee, mustard, and curry leaves for a comforting postpartum rasam.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 380, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 190, stockQuantity: 50 },
    ],
  },
  {
    name: 'Garlic Chutney Pudi', category: 'Homemade Pudi',
    keyBenefits: 'Made with roasted garlic, dry coconut, and spices. Garlic supports lactation, boosts immunity, and has natural antibacterial properties.',
    howToUse: 'Mix with hot rice and ghee. Perfect accompaniment to idli, dosa, or any rice preparation.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 380, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 190, stockQuantity: 50 },
    ],
  },
  {
    name: 'Ginger Jaggery Laddu', category: 'Homemade Pudi',
    keyBenefits: 'Made with ginger, ghee, jaggery, and salt. Ginger supports digestion, reduces nausea, and warms the body. Jaggery provides iron and minerals.',
    howToUse: 'Eat 1-2 laddus daily as a healthy snack. Best enjoyed with warm milk or tea.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 160, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 80, stockQuantity: 50 },
    ],
  },
  {
    name: 'Bananthi Lehya', category: 'Homemade Pudi',
    keyBenefits: 'Traditional Ayurvedic lehya formulated for postpartum recovery. A concentrated herbal preparation that supports overall healing, energy, and wellness.',
    howToUse: 'Take 1 teaspoon daily, preferably with warm milk. Best consumed in the morning on an empty stomach for maximum absorption.',
    shippingReturns: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    variants: [
      { unitLabel: '250 Gms', price: 820, stockQuantity: 50 },
      { unitLabel: '100 Gms', price: 410, stockQuantity: 50 },
    ],
  },
];

function toSlug(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function seedVariants() {
  console.log('Starting product variants seed...\n');

  const existingProducts = await prisma.product.findMany({
    include: { variants: true },
  });

  const finalNames = FINAL_PRODUCTS.map(p => p.name.toLowerCase().trim());

  // Step 1: Deactivate products not in the final list (keep them but mark inactive)
  for (const existing of existingProducts) {
    const nameMatch = finalNames.some(fn =>
      fn === existing.name.toLowerCase().trim() ||
      fn === existing.title.toLowerCase().trim()
    );
    if (!nameMatch) {
      console.log(`  Deactivating: "${existing.name}" (not in final product list)`);
      await prisma.product.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }
  }

  // Step 2: Create or update each final product with variants
  for (const prod of FINAL_PRODUCTS) {
    const slug = toSlug(prod.name);
    const lowestPrice = Math.min(...prod.variants.map(v => v.price));

    let existing = existingProducts.find(
      e => e.name.toLowerCase().trim() === prod.name.toLowerCase().trim() ||
           e.title.toLowerCase().trim() === prod.name.toLowerCase().trim() ||
           e.slug === slug
    );

    if (existing) {
      // Update existing product
      console.log(`  Updating existing product: "${prod.name}"`);
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: prod.name,
          title: prod.name,
          category: prod.category,
          price: lowestPrice,
          isActive: true,
          keyBenefits: prod.keyBenefits,
          howToUse: prod.howToUse,
          shippingReturns: prod.shippingReturns,
        },
      });

      // Delete old variants and create new ones
      await prisma.productVariant.deleteMany({ where: { productId: existing.id } });
      for (let i = 0; i < prod.variants.length; i++) {
        const v = prod.variants[i];
        await prisma.productVariant.create({
          data: {
            productId: existing.id,
            unitLabel: v.unitLabel,
            price: v.price,
            stockQuantity: v.stockQuantity,
            sortOrder: i,
          },
        });
      }
      console.log(`    → ${prod.variants.length} variants created`);
    } else {
      // Create new product
      console.log(`  Creating new product: "${prod.name}"`);
      const created = await prisma.product.create({
        data: {
          name: prod.name,
          title: prod.name,
          slug,
          price: lowestPrice,
          category: prod.category,
          description: '',
          isActive: true,
          keyBenefits: prod.keyBenefits,
          howToUse: prod.howToUse,
          shippingReturns: prod.shippingReturns,
          variants: {
            create: prod.variants.map((v, i) => ({
              unitLabel: v.unitLabel,
              price: v.price,
              stockQuantity: v.stockQuantity,
              sortOrder: i,
            })),
          },
        },
      });
      console.log(`    → Created with ${prod.variants.length} variants (id: ${created.id})`);
    }
  }

  // Summary
  const activeCount = await prisma.product.count({ where: { isActive: true } });
  const variantCount = await prisma.productVariant.count();
  console.log(`\nDone! Active products: ${activeCount}, Total variants: ${variantCount}`);
}

seedVariants()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
