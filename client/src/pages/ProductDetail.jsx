import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/seo/SEOHead';
import { BASE_URL } from '../components/seo/SEOHead';
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
  const [activeImg, setActiveImg] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const galleryRef = useRef(null);

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
          setActiveImg(0);
          if (data.variants?.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const images = product?.images?.length
    ? product.images
    : [product?.image || '/images/main.png'];

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, images.length - 1));
    setActiveImg(clamped);
  }, [images.length]);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo(diff > 0 ? activeImg + 1 : activeImg - 1);
    }
    setTouchStart(null);
  };

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
  const primaryImage = images[0];
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
      image: primaryImage,
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

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: product.description || '',
    image: primaryImage,
    url: `${BASE_URL}/products/${product.slug || product._id || product.id}`,
    brand: { '@type': 'Brand', name: 'Bananthi Mane' },
    offers: {
      '@type': 'Offer',
      price: activePrice,
      priceCurrency: 'INR',
      availability: outOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Bananthi Mane' },
    },
  };

  return (
    <main className="page-enter">
      <SEOHead
        title={name}
        description={product.description?.substring(0, 160) || `Buy ${name} from Bananthi Mane — 100% natural, traditionally prepared postpartum care product.`}
        canonical={`/products/${product.slug || product._id || product.id}`}
        ogType="product"
        ogImage={primaryImage}
        structuredData={productSchema}
      />
      <div className="pdp-container">
        <div className="pdp-image-col">
          <div
            className="pdp-gallery"
            ref={galleryRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[activeImg]}
              alt={`${name} — image ${activeImg + 1}`}
              className="pdp-main-img"
            />

            {images.length > 1 && (
              <>
                <button
                  className="pdp-arrow pdp-arrow-left"
                  onClick={() => goTo(activeImg - 1)}
                  disabled={activeImg === 0}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  className="pdp-arrow pdp-arrow-right"
                  onClick={() => goTo(activeImg + 1)}
                  disabled={activeImg === images.length - 1}
                  aria-label="Next image"
                >
                  ›
                </button>

                <div className="pdp-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`pdp-dot ${i === activeImg ? 'active' : ''}`}
                      onClick={() => goTo(i)}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="pdp-thumbnails">
              {images.map((src, i) => (
                <button
                  key={i}
                  className={`pdp-thumb ${i === activeImg ? 'active' : ''}`}
                  onClick={() => goTo(i)}
                >
                  <img src={src} alt={`${name} thumbnail ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
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
