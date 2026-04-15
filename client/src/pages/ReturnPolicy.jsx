import SEOHead from '../components/seo/SEOHead';
import './StaticPage.css';

export default function ReturnPolicy() {
  return (
    <main className="static-page page-enter">
      <SEOHead
        title="Cancellation & Refund Policy"
        description="Bananthi Mane cancellation and refund policy — how to cancel orders, return products, and get refunds for our natural postpartum care products."
        canonical="/cancellation-refund-policy"
      />
      <div className="static-header">
        <p className="static-label">Legal</p>
        <h1>Cancellation &amp; Refund Policy</h1>
        <p className="static-subtitle">Last updated: 4 April 2026</p>
      </div>

      <div className="static-content policy-content">
        <section>
          <h2>1. Order Cancellation</h2>
          <ul className="policy-list">
            <li>
              You can cancel an order before it is shipped by emailing{' '}
              <a href="mailto:sales@bananthimane.com" className="link-green">sales@bananthimane.com</a>{' '}
              with your Order ID.
            </li>
            <li>Once shipped, cancellation is not possible (you may request a return instead).</li>
          </ul>
        </section>

        <section>
          <h2>2. Returns</h2>
          <ul className="policy-list">
            <li>We accept returns within <strong>7 days</strong> of delivery for defective, damaged, or wrong items only.</li>
            <li>Products must be unused, unwashed, in original packaging with tags intact.</li>
            <li>
              For hygiene reasons, we <strong>do not accept returns</strong> on: breast pump parts,
              nipple shields, nursing bras (if worn), and opened baby skincare items.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Refunds</h2>
          <ul className="policy-list">
            <li>
              Approved refunds are processed to the original payment method within{' '}
              <strong>5–7 business days</strong> after we receive and inspect the return.
            </li>
            <li>COD refunds are issued via bank transfer/UPI.</li>
            <li>Shipping charges are non-refundable.</li>
          </ul>
        </section>

        <section>
          <h2>4. Exchanges</h2>
          <p>
            Size exchanges for maternity wear/nursing tops are allowed once, subject to stock availability
            (customer bears return shipping).
          </p>
        </section>

        <section className="policy-contact">
          <h2>5. Contact for Returns</h2>
          <p>
            Email <a href="mailto:sales@bananthimane.com">sales@bananthimane.com</a> with
            subject &ldquo;Return Request – Order #[ID]&rdquo; and photos of the issue.
          </p>
        </section>
      </div>
    </main>
  );
}
