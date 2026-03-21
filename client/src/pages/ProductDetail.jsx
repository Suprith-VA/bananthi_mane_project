import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    fetch(`/api/products/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error('Failed to load product');
        return r.json();
      })
      .then(data => { if (data) setProduct(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: '80px 5%', textAlign: 'center', color: '#888' }}>
        Loading product…
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div style={{ padding: '80px 5%', textAlign: 'center' }}>
        <p>Product not found.</p>
        <button className="btn" onClick={() => navigate('/products')} style={{ marginTop: 20 }}>
          Back to Products
        </button>
      </div>
    );
  }

  const name = product.name || product.title;
  const price = product.price;
  const image = product.image || '/images/main.png';
  const outOfStock = (product.stockQuantity ?? product.stock ?? 1) === 0;

  const accordionItems = [
    { title: 'Key Benefits', content: 'Rich in natural antioxidants and minerals. Supports postpartum recovery, boosts energy levels, and aids in hormonal balance during the fourth trimester.' },
    { title: 'How to Use', content: 'Use as directed. For best results, incorporate into your daily postpartum diet or care routine. Consult your healthcare provider if you have specific concerns.' },
    { title: 'Shipping & Returns', content: 'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.' },
  ];

  return (
    <main className="page-enter">
      <div className="pdp-container">
        <div className="pdp-image-col">
          <img src={image} alt={name} />
        </div>

        <div className="pdp-info-col">
          <div className="breadcrumb" onClick={() => navigate('/products')}>
            ← Back to Products
          </div>
          <h1>{name}</h1>
          <div className="pdp-price">₹{price?.toFixed(2)}</div>
          <p className="pdp-description">{product.description}</p>
          {product.category && (
            <p className="pdp-category">Category: {product.category}</p>
          )}

          <button
            className="btn pdp-atc-btn"
            onClick={() => addToCart(name, price)}
            disabled={outOfStock}
          >
            {outOfStock ? 'Out of Stock' : 'Add to Bag'}
          </button>

          <div className="pdp-accordion">
            {accordionItems.map((item, i) => (
              <div key={i} className="accordion-item">
                <button
                  className="accordion-toggle"
                  onClick={() => setOpenAccordion(openAccordion === i ? null : i)}
                >
                  <span>{item.title}</span>
                  <span>{openAccordion === i ? '−' : '+'}</span>
                </button>
                {openAccordion === i && (
                  <p className="accordion-body">{item.content}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
