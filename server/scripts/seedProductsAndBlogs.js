import 'dotenv/config';
import prisma from '../config/prisma.js';
import { toSlug } from '../utils/helpers.js';

function getImageForProduct(name) {
  const n = name.toLowerCase();
  if (n.includes('palm jaggery') || (n.includes('jaggery') && !n.includes('joni'))) return '/images/Palm_Jaggery.png';
  if (n.includes('coconut oil')) return '/images/coconut_oil.png';
  if (n.includes('sesame oil') || n.includes('seseme')) return '/images/Seseme_Oil.png';
  if (n.includes('castor oil')) return '/images/Castor_oil.png';
  if (n.includes('peanut oil')) return '/images/Peanut_oil.png';
  if (n.includes('neem paste') || n.includes('neem powder') || n.includes('neem')) return '/images/Neem_paste.png';
  if (n.includes('oil') || n.includes('ghee')) return '/images/coconut_oil.png';
  if (n.includes('powder') || n.includes('mix') || n.includes('seeds') || n.includes('leaf') || n.includes('leaves') || n.includes('garlic')) return '/images/Neem_paste.png';
  if (n.includes('laddu') || n.includes('snacks') || n.includes('balls') || n.includes('lehya') || n.includes('bella') || n.includes('joni')) return '/images/Palm_Jaggery.png';
  return '/images/Palm_Jaggery.png';
}

function getCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('oil') || n.includes('ghee')) return 'Oils & Fats';
  if (n.includes('powder') || n.includes('chutney') || n.includes('kashaya') || n.includes('rasam')) return 'Powders & Mixes';
  if (n.includes('mix') || n.includes('rawa')) return 'Powders & Mixes';
  if (n.includes('laddu') || n.includes('lehya') || n.includes('snacks') || n.includes('balls') || n.includes('ginger ball')) return 'Wellness Foods';
  if (n.includes('jaggery') || n.includes('bella')) return 'Natural Sweeteners';
  if (n.includes('bath') || n.includes('stretch cream') || n.includes('kajal') || n.includes('soapnut') || n.includes('charcoal')) return 'Personal Care';
  if (n.includes('belt') || n.includes('scarf') || n.includes('anklet') || n.includes('basket') || n.includes('spoon') || n.includes('bamboo')) return 'Accessories';
  if (n.includes('herb') || n.includes('shatavari') || n.includes('fenugreek') || n.includes('turmeric') || n.includes('ginger') || n.includes('aliv') || n.includes('chickpea') || n.includes('dill') || n.includes('ajwain') || n.includes('garlic peel')) return 'Herbs & Spices';
  return 'General';
}

const productData = [
  { name: 'Ajwain chutney powder',        price: 450 },
  { name: 'Alave payasa instant mix',      price: 280 },
  { name: 'Bamboo basket',                 price: 350 },
  { name: 'Bananthi Lehya',                price: 520 },
  { name: 'Bananthi laddu',                price: 480 },
  { name: 'Bath powder',                   price: 220 },
  { name: 'Black thread anklet',           price: 180 },
  { name: 'Charcoal',                      price: 150 },
  { name: 'Curry leaf chutney powder',     price: 250 },
  { name: 'Digestion powder',              price: 300 },
  { name: 'Dill leaf chutney powder',      price: 260 },
  { name: 'Cow dung',                      price: 150 },
  { name: 'Dill seeds kashaya',            price: 320 },
  { name: 'Dry beeda',                     price: 200 },
  { name: 'Feeder spoons',                 price: 190 },
  { name: 'Fenugreek chutney powder',      price: 270 },
  { name: 'Garlic chutney powder',         price: 290 },
  { name: 'Garlic ghee roast',             price: 380 },
  { name: 'Garlic peels',                  price: 240 },
  { name: 'Ghee',                          price: 560 },
  { name: 'Ginger balls',                  price: 320 },
  { name: 'Hip belt',                      price: 450 },
  { name: 'Joni bella',                    price: 220 },
  { name: 'Kajal (home made)',             price: 340 },
  { name: 'Maternity scarf for head',      price: 380 },
  { name: 'Rasam powder',                  price: 250 },
  { name: 'Rawa sajja mix',                price: 230 },
  { name: 'Shatavari granules',            price: 420 },
  { name: 'Shunti rawa mix',               price: 240 },
  { name: 'Stretch cream',                 price: 480 },
  { name: 'Strengthen snacks',             price: 360 },
  { name: 'Traditional bath leaf powder',  price: 230 },
  { name: 'Upma rawa mix',                 price: 230 },
  { name: 'Warm up powder',               price: 220 },
  { name: 'Sesame oil',                    price: 350 },
  { name: 'Palm Jaggery',                  price: 450 },
  { name: 'Coconut oil',                   price: 350 },
  { name: 'Castor oil',                    price: 380 },
  { name: 'Soapnut',                       price: 200 },
  { name: 'Dry ginger powder',             price: 220 },
  { name: 'Fenugreek',                     price: 240 },
  { name: 'Turmeric powder',              price: 280 },
  { name: 'Dry Garlic powder',             price: 240 },
  { name: 'Aliv seeds',                    price: 260 },
  { name: 'Chickpea powder',               price: 220 },
  { name: 'Neem powder',                   price: 250 },
];

// Bestseller names (match seed data above)
const BESTSELLER_NAMES = ['Palm Jaggery', 'Neem powder', 'Coconut oil'];

const blogData = [
  {
    title: 'The Golden Window of Recovery',
    slug: 'the-golden-window-of-recovery',
    content: `The first 40 days after childbirth are considered a sacred recovery window in many traditional systems of care. During this phase, the body undergoes rapid repair while the mother adapts physically and emotionally to newborn life.

Structured rest, warm and digestible meals, and consistent family support reduce the overall stress load and support faster healing. This period also helps create a stable foundation for lactation and long-term well-being.

When mothers are given space to recover deeply, outcomes improve across energy, mood, digestion, and confidence. Postpartum care is not a luxury; it is essential healthcare.`,
    excerpt: 'Understanding the vital importance of the first 40 days postpartum and why deep rest is essential.',
    featuredImage: '/images/blog_2.png',
    isFeatured: true,
  },
  {
    title: 'Benefits of Abhyanga',
    slug: 'benefits-of-abhyanga',
    content: `Abhyanga is a gentle full-body oiling practice designed to calm the nervous system and support circulation. In postpartum care, this ritual can reduce stiffness, improve sleep quality, and promote a stronger mind-body connection.

Using warm oils with steady strokes gives the body a feeling of grounding during a period of major hormonal shifts. It can also help with dryness, joint discomfort, and overall fatigue.

A consistent and simple routine, even if brief, is often more effective than occasional intensive sessions. The goal is regular nourishment and nervous system safety.`,
    excerpt: 'How traditional daily oil massage helps soothe the nervous system and balance Vata dosha.',
    featuredImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600',
    isFeatured: false,
  },
  {
    title: 'Nourishing Lactation Foods',
    slug: 'nourishing-lactation-foods',
    content: `Lactation-friendly foods focus on warmth, easy digestion, and nutrient density. Traditional recipes often include ingredients such as fenugreek, dill, healthy fats, and mineral-rich sweeteners.

The aim is not only milk production, but also maternal vitality. Balanced meals with protein, hydration, and supportive herbs can improve both milk supply and recovery energy.

Every mother responds differently, so observing tolerance and adjusting gently is key. Pairing food support with rest and hydration delivers the best outcomes.`,
    excerpt: 'A guide to traditional galactagogues designed to support a healthy milk supply naturally.',
    featuredImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
    isFeatured: false,
  },
];

async function seed() {
  console.log('Seeding products…');
  let created = 0, updated = 0;

  for (const p of productData) {
    const slug = toSlug(p.name);
    const image = getImageForProduct(p.name);
    const category = getCategory(p.name);
    const isBestseller = BESTSELLER_NAMES.map(n => n.toLowerCase()).includes(p.name.toLowerCase());

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      await prisma.product.update({
        where: { slug },
        data: { title: p.name, name: p.name, price: p.price, image, images: [image], category, isBestseller },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          title: p.name, name: p.name, slug, price: p.price, image, images: [image],
          description: 'Carefully sourced and traditionally prepared to support the delicate postpartum window. Crafted using ancestral knowledge to nourish the body, soothe the nervous system, and promote vital healing during the fourth trimester.',
          category, stockQuantity: 100, isActive: true, isBestseller,
        },
      });
      created++;
    }
  }
  console.log(`  Products: ${created} created, ${updated} updated`);

  console.log('Seeding blogs…');
  let bCreated = 0, bUpdated = 0;

  for (const b of blogData) {
    const existing = await prisma.blog.findUnique({ where: { slug: b.slug } });
    if (existing) {
      await prisma.blog.update({
        where: { slug: b.slug },
        data: { title: b.title, content: b.content, featuredImage: b.featuredImage, isFeatured: b.isFeatured },
      });
      bUpdated++;
    } else {
      await prisma.blog.create({
        data: {
          title: b.title, slug: b.slug, content: b.content, featuredImage: b.featuredImage,
          isPublished: true, isFeatured: b.isFeatured, publishedAt: new Date(),
          authorName: 'Bananthi Mane',
        },
      });
      bCreated++;
    }
  }
  console.log(`  Blogs: ${bCreated} created, ${bUpdated} updated`);

  await prisma.$disconnect();
  console.log('Done!');
}

seed().catch(e => { console.error(e); process.exit(1); });
