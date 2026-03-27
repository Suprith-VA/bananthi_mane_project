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
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);

    fetch(`/api/products/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error('Failed to load product');
        return r.json();
      })
      .then(data => {
        if (data) {
          setProduct(data);
          if (data.variants?.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      })
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
  const hasVariants = product.variants?.length > 0;
  const activePrice = selectedVariant?.price ?? product.price;
  const image = product.image || '/images/main.png';
  const outOfStock = hasVariants
    ? (selectedVariant?.stockQuantity ?? 0) === 0
    : (product.stockQuantity ?? product.stock ?? 1) === 0;

  const handleAddToCart = () => {
    addToCart({
      productId: product._id || product.id,
      variantId: selectedVariant?._id || selectedVariant?.id || null,
      name,
      unitLabel: selectedVariant?.unitLabel || null,
      price: activePrice,
      image,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const accordionItems = [
    {
      title: 'Key Benefits',
      content: product.keyBenefits ||
        'Rich in natural antioxidants and minerals. Supports postpartum recovery, boosts energy levels, and aids in hormonal balance during the fourth trimester.',
    },
    {
      title: 'How to Use',
      content: product.howToUse ||
        'Use as directed. For best results, incorporate into your daily postpartum diet or care routine. Consult your healthcare provider if you have specific concerns.',
    },
    {
      title: 'Shipping & Returns',
      content: product.shippingReturns ||
        'Orders are dispatched within 2–3 business days. Free shipping on orders above ₹999. Returns accepted within 7 days for unopened items.',
    },
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
          <div className="pdp-price">₹{activePrice?.toFixed(2)}</div>

          {hasVariants && (
            <div className="pdp-variants">
              <p className="pdp-variants-label">Select Size</p>
              <div className="pdp-variant-pills">
                {product.variants.map(v => {
                  const vid = v._id || v.id;
                  const isSelected = (selectedVariant?._id || selectedVariant?.id) === vid;
                  const isOos = (v.stockQuantity ?? 0) === 0;
                  return (
                    <button
                      key={vid}
                      className={`variant-pill ${isSelected ? 'active' : ''} ${isOos ? 'oos' : ''}`}
                      onClick={() => !isOos && setSelectedVariant(v)}
                      disabled={isOos}
                      title={isOos ? 'Out of stock' : `₹${v.price}`}
                    >
                      {v.unitLabel}
                      <span className="variant-pill-price">₹{v.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="pdp-description">{product.description}</p>
          {product.category && (
            <p className="pdp-category">Category: {product.category}</p>
          )}

          <button
            className={`btn pdp-atc-btn ${addedFeedback ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            {outOfStock ? 'Out of Stock' : addedFeedback ? 'Added to Bag ✓' : 'Add to Bag'}
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
