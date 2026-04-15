import SEOHead from '../components/seo/SEOHead';
import './StaticPage.css';

export default function PrivacyPolicy() {
  return (
    <main className="static-page page-enter">
      <SEOHead
        title="Privacy Policy"
        description="Bananthi Mane privacy policy — how we collect, use, and protect your personal information when you shop with us."
        canonical="/privacy-policy"
      />
      <div className="static-header">
        <p className="static-label">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="static-subtitle">Last updated: 4 April 2026</p>
      </div>

      <div className="static-content policy-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            Bananthi Mane (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates{' '}
            <a href="https://www.bananthimane.com" className="link-green">www.bananthimane.com</a>.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you visit our website or purchase products for new mothers and babies.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <ul className="policy-list">
            <li><strong>Personal Information:</strong> name, email, phone number, shipping/billing address, payment details</li>
            <li><strong>Non-Personal Information:</strong> browser type, IP address, pages visited</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <ul className="policy-list">
            <li>To process and deliver orders (cold-pressed oils, organic powders, homemade pudi, postpartum care products, etc.)</li>
            <li>To provide customer support and order updates via email/WhatsApp/SMS</li>
            <li>To send offers and newsletters (you can unsubscribe anytime)</li>
            <li>To improve our website and product recommendations</li>
          </ul>
        </section>

        <section>
          <h2>4. Sharing of Information</h2>
          <p>
            We do not sell your data. We share it only with trusted partners: payment gateways (Razorpay),
            courier services (via Shiprocket), and SMS/email providers — solely to fulfill your order.
          </p>
        </section>

        <section>
          <h2>5. Cookies</h2>
          <p>
            We use cookies to remember your cart, analyze traffic, and personalize your experience.
            You can disable cookies in your browser settings.
          </p>
        </section>

        <section>
          <h2>6. Data Security</h2>
          <p>
            We use SSL encryption and secure payment gateways. However, no online transmission is 100% secure.
          </p>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>
            You may request access, correction, or deletion of your data by emailing{' '}
            <a href="mailto:sales@bananthimane.com" className="link-green">sales@bananthimane.com</a>.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>Updates will be posted on this page with a revised date.</p>
        </section>

        <section className="policy-contact">
          <h2>9. Contact Us</h2>
          <p>
            Email: <a href="mailto:sales@bananthimane.com">sales@bananthimane.com</a><br />
            Phone: <a href="tel:+919945690318">+91-9945690318</a><br />
            Address: 16/17, 5th Cross, 1st Block Akshaya Nagar, RM Nagar, Bangalore-560016
          </p>
        </section>
      </div>
    </main>
  );
}
