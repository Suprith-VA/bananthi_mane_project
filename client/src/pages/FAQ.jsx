import { useState } from 'react';
import './StaticPage.css';

const quickFaqs = [
  {
    icon: '🚚',
    q: 'How long does delivery take?',
    a: '2–4 days (metros), 4–7 days (other cities), 7–10 days (remote areas). Orders ship within 1–2 business days.',
  },
  {
    icon: '💰',
    q: 'What are the shipping charges?',
    a: 'Free shipping on orders above ₹999. Otherwise ₹79 flat, pan India.',
  },
  {
    icon: '↩️',
    q: 'Can I return products?',
    a: 'Yes, within 7 days for defective, damaged, or wrong items. No returns on opened food items (powders/pudis), hygiene products, or opened organic oils.',
  },
  {
    icon: '🏠',
    q: 'Are your powders & pudis homemade?',
    a: 'Yes — small batches, no preservatives, no added sugar, made with organic/local ingredients.',
  },
  {
    icon: '💳',
    q: 'What payment options do you have?',
    a: 'UPI, cards, net banking, wallets, and COD — all processed securely via Razorpay.',
  },
  {
    icon: '📧',
    q: 'Need help?',
    a: 'Email: sales@bananthimane.com | Phone: +91-9945690318 | We reply within 24 hrs (Mon–Sat).',
  },
];

const faqData = [
  {
    section: 'About Bananthi Mane',
    items: [
      {
        q: 'What is Bananthi Mane?',
        a: 'Bananthi Mane is a care store for new mothers and babies. We curate nursing essentials, postpartum recovery products, organic care for mothers, homemade powders & pudis, and baby care — all chosen to make the first months easier and more comfortable.',
      },
      {
        q: 'Are your products safe for newborns and new mothers?',
        a: 'Yes. We source from trusted Indian brands and prioritize safe, skin-friendly materials (BPA-free, hypoallergenic, dermatologically tested where applicable). Our organic range for mothers is free from parabens, sulphates, mineral oils, and artificial fragrances. For any medical concerns, please consult your doctor before use.',
      },
    ],
  },
  {
    section: 'Our Products & Ingredients',
    items: [
      {
        q: 'Are your powders & pudis really homemade?',
        a: 'Yes. They are prepared in small batches in a clean home kitchen setup using family recipes, with no preservatives, artificial colours, or flavours. We use only organic or locally sourced ingredients.',
      },
      {
        q: 'What ingredients do you use in powders/pudis?',
        a: 'We use organic millets, dry fruits (almonds, cashews, pistachios), seeds (flax, sesame, methi), herbs (shatavari, ajwain, jeera), dals, and spices. Full ingredient lists are on each product page.',
      },
      {
        q: 'Do your products contain artificial preservatives?',
        a: 'No. We offer 100% natural, traditionally prepared products with no preservatives, artificial colours, or flavours. Store powders and pudis in airtight containers in a cool, dry place.',
      },
      {
        q: 'Do you add sugar to powders/pudis?',
        a: 'No added sugar, preservatives, or artificial additives. Some blends (like dry fruit powder) have natural sweetness from dates/raisins only.',
      },
      {
        q: 'What is the shelf life of powders and pudis?',
        a: 'Powders: 2–3 months from date of packing. Pudis: 1–2 months from date of packing. Store in an airtight container in a cool, dry place (refrigeration recommended for longer freshness). Packing date is on the label.',
      },
      {
        q: 'Are they safe to consume after delivery?',
        a: 'Yes — made keeping postpartum needs in mind with mother-friendly ingredients. If you have specific health conditions (thyroid, diabetes, allergies), check with your doctor before consuming.',
      },
      {
        q: 'Can family members also eat the powders/pudis?',
        a: 'Yes! While formulated for new mothers, our dry fruit powder and pudis are nutritious and enjoyed by the whole family.',
      },
      {
        q: 'How should I consume the powders?',
        a: 'Lactation/Health Mix: 1–2 tbsp with warm milk or water, once or twice daily. Dry Fruit Powder: mix in milk, porridge, or laddoos. Pudis: mix with hot rice and ghee/sesame oil, or sprinkle on idli/dosa. Preparation suggestions are on each pack.',
      },
    ],
  },
  {
    section: 'Shipping & Order Tracking',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Metro cities: 2–4 business days. Other cities/towns: 4–7 business days. Remote areas: 7–10 business days. Orders are processed within 1–2 business days (Mon–Sat).',
      },
      {
        q: 'What are the shipping charges?',
        a: 'Free shipping on orders above ₹999. Standard shipping: ₹79 (pan India). You\'ll get a tracking link by email/SMS once your order ships.',
      },
      {
        q: 'How can I track my order?',
        a: 'After dispatch, you\'ll receive a tracking link from Shiprocket via email and SMS. You can also track your order on our Track Order page, or write to sales@bananthimane.com with your Order ID.',
      },
    ],
  },
  {
    section: 'Returns, Refunds & Cancellations',
    items: [
      {
        q: 'Can I cancel my order?',
        a: 'Yes, if it hasn\'t shipped yet. Email us at sales@bananthimane.com with your Order ID. Once shipped, cancellation isn\'t possible but you can request a return (if eligible).',
      },
      {
        q: 'What is your return & refund policy?',
        a: 'We accept returns within 7 days of delivery for defective, damaged, or wrong items. Items must be unused, unwashed, in original packaging. For hygiene reasons, we cannot accept returns on breast pump parts, nipple shields, nursing bras (if worn), opened organic mother care oils/creams, and opened food items (powders/pudis). Approved refunds are processed in 5–7 business days. Shipping charges are non-refundable.',
      },
      {
        q: 'I received a damaged/wrong product. What should I do?',
        a: 'Please email sales@bananthimane.com within 48 hours of delivery with your Order ID and clear photos of the product and packaging. We\'ll arrange a replacement or refund.',
      },
    ],
  },
  {
    section: 'Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'UPI, credit/debit cards, net banking, wallets, and Cash on Delivery (COD) — all processed securely via Razorpay.',
      },
      {
        q: 'My COD order was not accepted at delivery. Can I reorder?',
        a: 'Yes, but repeated COD rejections may lead to COD being disabled for your account. Please ensure someone is available to receive the order and payment.',
      },
    ],
  },
  {
    section: 'Postpartum Services',
    items: [
      {
        q: 'What in-home services do you offer?',
        a: 'We are currently expanding our offerings to include traditional in-home postpartum massage (Abhyanga), specialized dietary planning, and newborn care assistance in select cities.',
      },
      {
        q: 'How do I book a service?',
        a: 'Our services are currently in high demand and operating on a waitlist. Please visit our Services page to fill out the inquiry form with your Expected Due Date, and our care team will reach out to you directly as availability opens up.',
      },
    ],
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="faq-answer"><p>{a}</p></div>}
    </div>
  );
}

export default function FAQ() {
  return (
    <main className="static-page page-enter">
      <div className="static-header">
        <p className="static-label">Support</p>
        <h1>Frequently Asked Questions</h1>
        <p className="static-subtitle">Everything you need to know about Bananthi Mane products and services.</p>
      </div>

      <div className="static-content faq-content">

        {/* ── Quick FAQs ───────────────────────────────── */}
        <section className="faq-section">
          <h2 className="faq-section-title">Quick Answers</h2>
          <div className="faq-quick-grid">
            {quickFaqs.map(({ icon, q, a }) => (
              <div key={q} className="faq-quick-card">
                <span className="faq-quick-icon">{icon}</span>
                <h3 className="faq-quick-q">{q}</h3>
                <p className="faq-quick-a">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Detailed FAQs ───────────────────────────── */}
        <div className="faq-detailed-label">
          <span>Still have questions? Browse the full FAQ below.</span>
        </div>

        {faqData.map(({ section, items }) => (
          <section key={section} className="faq-section">
            <h2 className="faq-section-title">{section}</h2>
            <div className="faq-list">
              {items.map(({ q, a }) => (
                <AccordionItem key={q} q={q} a={a} />
              ))}
            </div>
          </section>
        ))}

        <div className="faq-contact-cta">
          <p>Didn't find your answer?</p>
          <a href="/contact" className="btn">Contact Us</a>
        </div>
      </div>
    </main>
  );
}
