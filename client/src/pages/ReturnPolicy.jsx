import './StaticPage.css';

export default function ReturnPolicy() {
  return (
    <main className="static-page page-enter">
      <div className="static-header">
        <p className="static-label">Legal</p>
        <h1>Return, Refund &amp; Cancellation Policy</h1>
        <p className="static-subtitle">Last updated: {new Date().getFullYear()}</p>
      </div>

      <div className="static-content policy-content">
        <section>
          <h2>Overview</h2>
          <p>
            At Bananthi Mane, we maintain the highest standards of hygiene, safety, and quality for our postpartum
            mothers and their babies. Because our catalog consists of consumable foods, herbal apothecary items, and
            personal care products, <strong>all sales are final and non-returnable</strong>. We do not accept returns
            or exchanges for opened or unused products due to a change of mind, taste preference, or subjective
            dissatisfaction.
          </p>
        </section>

        <section>
          <h2>Exceptions: Damaged, Defective, or Incorrect Items</h2>
          <p>We will happily issue a <strong>full refund or a free replacement</strong> only under the following circumstances:</p>
          <ul className="policy-list">
            <li>The product delivered was physically damaged or spilled in transit.</li>
            <li>The product delivered does not match your order.</li>
            <li>The product delivered is past its expiry date.</li>
          </ul>
        </section>

        <section>
          <h2>How to Claim a Refund or Replacement</h2>
          <ol className="policy-list">
            <li>You must notify our Customer Care team within <strong>48 hours</strong> of receiving your delivery.</li>
            <li>Please include your <strong>Order ID</strong> and attach clear unboxing photos or a video showing the damaged/incorrect product and the outer shipping box.</li>
            <li>Once our team verifies the claim, we will initiate a reverse pickup (if required) and dispatch your replacement or process your refund immediately.</li>
          </ol>
        </section>

        <section>
          <h2>Cancellations</h2>
          <div className="policy-highlight">
            <div className="policy-highlight-item">
              <h3>Before Dispatch</h3>
              <p>You may cancel your order for a full refund as long as the order has not yet been packed and shipped. Please contact us immediately to request a cancellation.</p>
            </div>
            <div className="policy-highlight-item policy-highlight-warn">
              <h3>After Dispatch</h3>
              <p>Once an order has been handed over to our shipping partner and an AWB tracking number has been generated, the order <strong>cannot be cancelled or modified</strong>.</p>
            </div>
          </div>
        </section>

        <section>
          <h2>Refund Processing Timeline</h2>
          <p>
            Approved refunds for prepaid orders or cancelled orders will be credited back to your original method of
            payment (via Razorpay) within <strong>5 to 7 business days</strong>, depending on your bank's processing time.
          </p>
        </section>

        <section className="policy-contact">
          <h2>Contact Us</h2>
          <p>For any refund or return-related queries, please reach out to our Customer Care team via the <a href="/contact">Contact page</a>.</p>
        </section>
      </div>
    </main>
  );
}
