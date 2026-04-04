import './StaticPage.css';

export default function TermsConditions() {
  return (
    <main className="static-page page-enter">
      <div className="static-header">
        <p className="static-label">Legal</p>
        <h1>Terms &amp; Conditions</h1>
        <p className="static-subtitle">Last updated: 4 April 2026</p>
      </div>

      <div className="static-content policy-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By using <a href="https://www.bananthimane.com" className="link-green">www.bananthimane.com</a>,
            you agree to these Terms &amp; Conditions.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>You must be 18 years or older to place an order.</p>
        </section>

        <section>
          <h2>3. Products &amp; Pricing</h2>
          <ul className="policy-list">
            <li>All products (cold-pressed oils, organic powders, homemade pudi, postpartum care items, etc.) are described to the best of our ability.</li>
            <li>Prices are in INR and include applicable taxes. Prices may change without notice.</li>
          </ul>
        </section>

        <section>
          <h2>4. Orders</h2>
          <ul className="policy-list">
            <li>Placing an order is an offer to purchase. We may cancel orders due to stock unavailability or pricing errors.</li>
            <li>You will receive an order confirmation email.</li>
          </ul>
        </section>

        <section>
          <h2>5. Payments</h2>
          <p>
            We accept UPI, credit/debit cards, net banking, wallets, and Cash on Delivery (COD) via Razorpay.
          </p>
        </section>

        <section>
          <h2>6. Intellectual Property</h2>
          <p>
            All content, images, and logos on Bananthi Mane are our property and cannot be copied without permission.
          </p>
        </section>

        <section>
          <h2>7. Limitation of Liability</h2>
          <p>
            Bananthi Mane is not liable for indirect damages arising from product use.
            Please consult a doctor for any medical or postpartum concerns.
          </p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>
            These terms are governed by the laws of India, with jurisdiction in Bangalore, Karnataka.
          </p>
        </section>

        <section className="policy-contact">
          <h2>9. Contact</h2>
          <p>
            For questions about these terms, email{' '}
            <a href="mailto:sales@bananthimane.com">sales@bananthimane.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
