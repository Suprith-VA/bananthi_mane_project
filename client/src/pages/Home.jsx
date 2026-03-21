import Hero from '../components/home/Hero';
import BestsellerSection from '../components/home/BestsellerSection';
import FeaturedJournal from '../components/home/FeaturedJournal';

export default function Home() {
  return (
    <main className="page-enter">
      <Hero />
      <BestsellerSection />
      <FeaturedJournal />
    </main>
  );
}
