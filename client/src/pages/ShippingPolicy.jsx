import SEOHead from '../components/seo/SEOHead';
import './StaticPage.css';

export default function ShippingPolicy() {
  return (
    <main className="static-page page-enter">
      <SEOHead
        title="Shipping & Delivery Policy"
        description="Bananthi Mane shipping policy — delivery timelines, shipping charges, and pan-India delivery details for our natural postpartum products."
        canonical="/shipping-policy"
      />
      <div className="static-header">
        <p className="static-label">Legal</p>
        <h1>Shipping &amp; Delivery Policy</h1>
        <p className="static-subtitle">Last updated: 4 April 2026</p>
      </div>

      <div className="static-content policy-content">
        <section>
          <h2>1. Processing Time</h2>
          <p>
            Orders are processed within 1–2 business days (Monday–Saturday, excluding public holidays).
          </p>
        </section>

        <section>
          <h2>2. Shipping Partners</h2>
          <p>
            We ship via trusted logistics partners including Delhivery, Blue Dart, and India Post
            through our fulfilment partner Shiprocket.
          </p>
        </section>

        <section>
          <h2>3. Delivery Time</h2>
          <div className="policy-highlight" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="policy-highlight-item">
              <h3>Metro Cities</h3>
              <p>2–4 business days</p>
            </div>
            <div className="policy-highlight-item">
              <h3>Other Cities/Towns</h3>
              <p>4–7 business days</p>
            </div>
            <div className="policy-highlight-item">
              <h3>Remote Areas</h3>
              <p>7–10 business days</p>
            </div>
          </div>
        </section>

        <section>
          <h2>4. Shipping Charges</h2>
          <ul className="policy-list">
            <li><strong>Free shipping</strong> on orders above ₹999</li>
            <li><strong>Standard shipping:</strong> ₹79 (pan India)</li>
          </ul>
        </section>

        <section>
          <h2>5. Order Tracking</h2>
          <p>
            You will receive a tracking link via email once your order is shipped.
            You can also track your order anytime on our{' '}
            <a href="/track-order" className="link-green">Track Order</a> page using your Order ID.
          </p>
        </section>

        <section>
          <h2>6. Delays &amp; Issues</h2>
          <p>
            We are not responsible for delays due to courier issues, incorrect address, or force majeure events.
            Please provide a complete address and reachable phone number to avoid delivery failures.
          </p>
        </section>

        <section className="policy-contact">
          <h2>7. Contact</h2>
          <p>
            For shipping queries, email{' '}
            <a href="mailto:sales@bananthimane.com">sales@bananthimane.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
