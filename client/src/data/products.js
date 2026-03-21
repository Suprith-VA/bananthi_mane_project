// Product image helper — maps product name to local asset
export function getImageForProduct(name) {
  const n = name.toLowerCase();
  if (n.includes('palm jaggery') || (n.includes('jaggery') && !n.includes('joni'))) return '/images/Palm_Jaggery.png';
  if (n.includes('coconut oil')) return '/images/coconut_oil.png';
  if (n.includes('sesame oil') || n.includes('seseme')) return '/images/Seseme_Oil.png';
  if (n.includes('castor oil')) return '/images/Castor_oil.png';
  if (n.includes('peanut oil')) return '/images/Peanut_oil.png';
  if (n.includes('neem paste') || n.includes('neem powder')) return '/images/Neem_paste.png';
  // category fallbacks
  if (n.includes('oil') || n.includes('ghee')) return '/images/coconut_oil.png';
  if (n.includes('powder') || n.includes('mix') || n.includes('seeds') || n.includes('leaf') || n.includes('leaves') || n.includes('neem') || n.includes('garlic')) return '/images/Neem_paste.png';
  if (n.includes('laddu') || n.includes('snacks') || n.includes('balls') || n.includes('lehya') || n.includes('bella') || n.includes('joni')) return '/images/Palm_Jaggery.png';
  return '/images/Palm_Jaggery.png';
}

const allProductNames = [
  'Ajwain chutney powder', 'Alave payasa instant mix', 'Bamboo basket', 'Bananthi Lehya',
  'Bananthi laddu', 'Bath powder', 'Black thread anklet', 'Charcoal', 'Curry leaf chutney powder',
  'Digestion powder', 'Dill leaf chutney powder', 'Cow dung', 'Dill seeds kashaya', 'Dry beeda',
  'Feeder spoons', 'Fenugreek chutney powder', 'Garlic chutney powder', 'Garlic ghee roast',
  'Garlic peels', 'Ghee', 'Ginger balls', 'Hip belt', 'Joni bella', 'Kajal (home made)',
  'Maternity scarf for head', 'Rasam powder', 'Rawa sajja mix', 'Shatavari granules',
  'Shunti rawa mix', 'Stretch cream', 'Strengthen snacks', 'Traditional bath leaf powder',
  'Upma rawa mix', 'Warm up powder', 'Sesame oil', 'Palm Jaggery', 'Coconut oil', 'Castor oil',
  'Soapnut', 'Dry ginger powder', 'Fenugreek', 'Turmeric powder', 'Dry Garlic powder',
  'Aliv seeds', 'Chickpea powder', 'Neem powder',
];

// Stable prices (deterministic, not random, so they don't change on re-render)
const PRICE_SEED = [450, 280, 350, 520, 480, 220, 180, 150, 250, 300, 260, 150, 320, 200,
                    190, 270, 290, 380, 240, 560, 320, 450, 220, 340, 380, 250, 230, 420,
                    240, 480, 360, 230, 230, 220, 350, 450, 350, 380, 200, 220, 240, 280, 240, 260, 220, 250];

export const products = allProductNames.map((name, i) => ({
  id: i + 1,
  name,
  price: PRICE_SEED[i] ?? 250,
  image: getImageForProduct(name),
  description:
    'Carefully sourced and traditionally prepared to support the delicate postpartum window. Crafted using ancestral knowledge to nourish the body, soothe the nervous system, and promote vital healing during the fourth trimester.',
}));

export const bestsellers = [
  { id: 36, name: 'Palm Jaggery',  price: 450, image: '/images/Palm_Jaggery.png' },
  { id: 46, name: 'Neem Powder',   price: 350, image: '/images/Neem_paste.png'   },
  { id: 37, name: 'Coconut Oil',   price: 350, image: '/images/coconut_oil.png'  },
];

export const blogPosts = [
  {
    id: 1,
    title: 'The Golden Window of Recovery',
    excerpt: 'Understanding the vital importance of the first 40 days postpartum and why deep rest is essential.',
    image: '/images/blog_2.png',
    content: [
      'The first 40 days after childbirth are considered a sacred recovery window in many traditional systems of care. During this phase, the body undergoes rapid repair while the mother adapts physically and emotionally to newborn life.',
      'Structured rest, warm and digestible meals, and consistent family support reduce the overall stress load and support faster healing. This period also helps create a stable foundation for lactation and long-term well-being.',
      'When mothers are given space to recover deeply, outcomes improve across energy, mood, digestion, and confidence. Postpartum care is not a luxury; it is essential healthcare.'
    ],
  },
  {
    id: 2,
    title: 'Benefits of Abhyanga',
    excerpt: 'How traditional daily oil massage helps soothe the nervous system and balance Vata dosha.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600',
    content: [
      'Abhyanga is a gentle full-body oiling practice designed to calm the nervous system and support circulation. In postpartum care, this ritual can reduce stiffness, improve sleep quality, and promote a stronger mind-body connection.',
      'Using warm oils with steady strokes gives the body a feeling of grounding during a period of major hormonal shifts. It can also help with dryness, joint discomfort, and overall fatigue.',
      'A consistent and simple routine, even if brief, is often more effective than occasional intensive sessions. The goal is regular nourishment and nervous system safety.'
    ],
  },
  {
    id: 3,
    title: 'Nourishing Lactation Foods',
    excerpt: 'A guide to traditional galactagogues designed to support a healthy milk supply naturally.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600',
    content: [
      'Lactation-friendly foods focus on warmth, easy digestion, and nutrient density. Traditional recipes often include ingredients such as fenugreek, dill, healthy fats, and mineral-rich sweeteners.',
      'The aim is not only milk production, but also maternal vitality. Balanced meals with protein, hydration, and supportive herbs can improve both milk supply and recovery energy.',
      'Every mother responds differently, so observing tolerance and adjusting gently is key. Pairing food support with rest and hydration delivers the best outcomes.'
    ],
  },
];
