import SEOHead from '../components/seo/SEOHead';
import Hero from '../components/home/Hero';
import BestsellerSection from '../components/home/BestsellerSection';
import FeaturedJournal from '../components/home/FeaturedJournal';

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Bananthi Mane',
  url: 'https://www.bananthimane.com',
  logo: 'https://www.bananthimane.com/logo.png',
  image: 'https://www.bananthimane.com/logo.png',
  description:
    'Bananthi Mane offers handcrafted cold-pressed oils, organic powders, and homemade pudi for postpartum mothers and families. 100% natural, traditionally prepared.',
  telephone: '+91-9945690318',
  email: 'sales@bananthimane.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '16/17, 5th Cross, 1st Block Akshaya Nagar, RM Nagar',
    addressLocality: 'Bangalore',
    addressRegion: 'Karnataka',
    postalCode: '560016',
    addressCountry: 'IN',
  },
  priceRange: '₹₹',
  areaServed: 'IN',
  sameAs: [
    'https://www.instagram.com/bananthimane/',
  ],
};

export default function Home() {
  return (
    <main className="page-enter">
      <SEOHead canonical="/" structuredData={HOME_SCHEMA} />
      <Hero />
      <BestsellerSection />
      <FeaturedJournal />
    </main>
  );
}
