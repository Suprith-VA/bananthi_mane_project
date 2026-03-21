import { useState } from 'react';
import './StaticPage.css';

const faqData = [
  {
    section: 'Our Products & Ingredients',
    items: [
      {
        q: 'Are your products safe to consume while breastfeeding?',
        a: 'Yes. Our entire catalog is specifically curated to support postpartum mothers and nursing infants. Products like our Shatavari Granules and specialized Chutney Powders are traditional galactagogues meant to aid healthy lactation. However, as every body is different, we always recommend consulting your Ayurvedic practitioner or primary physician before introducing new herbs into your diet.',
      },
      {
        q: 'Do your products contain artificial preservatives?',
        a: 'No. We take pride in offering 100% natural, traditionally prepared holistic products. Because we avoid chemical preservatives, we recommend storing our edible powders, instant mixes, and Lehyas in airtight containers in a cool, dry place to maintain their freshness and efficacy.',
      },
      {
        q: 'How do I know how to use the herbs and powders?',
        a: 'Every product comes with clear instructions for traditional usage. Generally, our Kashaya powders and Lehyas are best consumed with warm water or warm milk to aid digestion and soothe the nervous system.',
      },
    ],
  },
  {
    section: 'Shipping & Order Tracking',
    items: [
      {
        q: 'How long will it take to receive my order?',
        a: 'All orders are freshly packed and dispatched from our facility within 24 to 48 hours. Depending on your pin code within India, standard delivery takes between 3 to 7 business days.',
      },
      {
        q: 'How can I track my shipment?',
        a: 'Once your order is packed, you will receive an email with your Order ID and an AWB (Tracking) number. You can easily track your package by entering your Order ID on our website\'s Track Order page, or by clicking the tracking link in your dispatch email, which will redirect you to our logistics partner\'s live tracker.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We process all payments securely via Razorpay. We accept all major Credit/Debit cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, and offer Cash on Delivery (COD) for eligible pin codes.',
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
