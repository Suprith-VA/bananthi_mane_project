import SEOHead from '../components/seo/SEOHead';
import './StaticPage.css';

export default function About() {
  return (
    <main className="about-page page-enter">
      <SEOHead
        title="About Us"
        description="Bananthi Mane was born from a deep respect for traditional postpartum wisdom. We provide 100% natural products handcrafted for new mothers' recovery and wellness."
        canonical="/about"
      />
      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <p className="about-eyebrow">About Bananthi Mane</p>
          <h1>The Postpartum Mother's House</h1>
          <p className="about-hero-body">
            In traditional Indian wisdom, the first 40 days after childbirth are considered a sacred
            "golden window." During this time, a mother's body is delicate, her digestion is sensitive,
            and her nervous system requires deep, grounding rest. <strong>Bananthi Mane</strong> was
            born out of a profound respect for this ancestral knowledge.
          </p>
        </div>
      </section>

      {/* ─── Vision ──────────────────────────────────────────── */}
      <section className="about-vision-section">
        <div className="about-section-inner">
          <span className="about-section-chip">Our Vision</span>
          <h2>Dignified Care for Every New Mother</h2>
          <p>
            To provide comfort, safety, and dignified care to enable better self-care for all the new
            mothers during the initial recovery stage.
          </p>
        </div>
      </section>

      {/* ─── Motto ───────────────────────────────────────────── */}
      <section className="about-motto-section">
        <div className="about-section-inner">
          <span className="about-section-chip chip-green">Our Motto</span>
          <h2 className="motto-headline">To build an ecosystem that heals, connects and rejuvenates.</h2>
          <div className="motto-pillars">
            <div className="motto-pillar">
              <span className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </span>
              <h3>Healthy Mother</h3>
              <p>A mother's physical and mental well-being is the foundation for a safe pregnancy and smooth recovery.</p>
            </div>
            <div className="motto-pillar">
              <span className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5v.01"/><path d="M16 15.5v.01"/><path d="M12 12v.01"/><path d="M11 17v.01"/><path d="M7 14v.01"/></svg>
              </span>
              <h3>Healthy Child</h3>
              <p>By supporting mothers with proper nutrition, rest and emotional care, we create conditions for optimal child development.</p>
            </div>
            <div className="motto-pillar">
              <span className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <h3>Healthy Ecosystem</h3>
              <p>Building a nurturing community and sustainable care practices ensures long-term benefits for families and society.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mission ─────────────────────────────────────────── */}
      <section className="about-mission-section">
        <div className="about-section-inner">
          <span className="about-section-chip">Our Mission</span>
          <h2>Redefining Maternal Wellness</h2>
          <p className="mission-intro">
            Our mission is to redefine maternal wellness by creating a holistic care ecosystem that
            blends tradition with modern science. We aim to:
          </p>
          <div className="mission-list">
            <div className="mission-item">
              <span className="mission-number">01</span>
              <div>
                <h3>Deliver Authentic, Personalized Care</h3>
                <p>Every mother and child is unique. We provide tailored care plans that respect cultural practices while incorporating evidence-based wellness strategies.</p>
              </div>
            </div>
            <div className="mission-item">
              <span className="mission-number">02</span>
              <div>
                <h3>Promote Holistic Health</h3>
                <p>Through structured workshops, guided meditation, and creative activities, we address both physical and mental well-being.</p>
              </div>
            </div>
            <div className="mission-item">
              <span className="mission-number">03</span>
              <div>
                <h3>Preserve Beneficial Traditional Practices</h3>
                <p>We integrate time-tested rituals and dietary habits that support postpartum recovery, ensuring they are safe and relevant in today's context.</p>
              </div>
            </div>
            <div className="mission-item">
              <span className="mission-number">04</span>
              <div>
                <h3>Create Better Living Conditions</h3>
                <p>Our facilities offer comfort, hygiene, and privacy, enabling mothers to rest and bond with their babies in a stress-free environment.</p>
              </div>
            </div>
            <div className="mission-item">
              <span className="mission-number">05</span>
              <div>
                <h3>Generate Employment Opportunities</h3>
                <p>By training caregivers, nutritionists, and wellness professionals, we contribute to skill development and dignified jobs in the maternal care sector.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Founders ────────────────────────────────────────── */}
      <section className="about-founders-section">
        <div className="about-section-inner">
          <span className="about-section-chip chip-green">Our Founders</span>
          <h2>The Faces Behind Bananthi Mane</h2>
          <div className="founders-grid">
            <div className="founder-card">
              <div className="founder-avatar">
                <span>SS</span>
              </div>
              <h3>Shwetha Shivakumar</h3>
              <p className="founder-role">Founder</p>
            </div>
            <div className="founder-card">
              <div className="founder-avatar">
                <span>KN</span>
              </div>
              <h3>Kattula Yogeshwara Naveen</h3>
              <p className="founder-role">Co-Founder</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
