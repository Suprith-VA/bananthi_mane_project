import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import OptimizedImage from '../common/OptimizedImage';
import SizeSelectModal from '../products/SizeSelectModal';
import './BestsellerSection.css';

export default function BestsellerSection() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sizeModalProduct, setSizeModalProduct] = useState(null);

  useEffect(() => {
    fetch('/api/products?bestseller=true')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  const handleAdd = (p) => {
    const id = p._id || p.id;
    const name = p.name || p.title;
    const hasVariants = p.variants?.length > 0;
    const lowestVariant = hasVariants
      ? p.variants.reduce((min, v) => (v.price < min.price ? v : min), p.variants[0])
      : null;

    if (hasVariants && p.variants.length > 1) {
      // Multiple variants → open size picker
      setSizeModalProduct(p);
    } else {
      // Single variant or no variants → add directly
      addToCart({
        productId: id,
        variantId: lowestVariant?._id || lowestVariant?.id || null,
        name,
        unitLabel: lowestVariant?.unitLabel || null,
        price: lowestVariant?.price ?? p.price,
        image: p.image || '/images/main.png',
      });
    }
  };

  return (
    <>
      <div className="bestsellers-section">
        <h2>Motherhood Essentials</h2>
        <div className="bestseller-grid">
          {products.map((p) => {
            const id = p._id || p.id;
            const name = p.name || p.title;
            const href = p.slug || id;
            const hasVariants = p.variants?.length > 0;
            const lowestVariant = hasVariants
              ? p.variants.reduce((min, v) => (v.price < min.price ? v : min), p.variants[0])
              : null;
            const displayPrice = lowestVariant?.price ?? p.price;
            const outOfStock = hasVariants
              ? p.variants.every(v => (v.stockQuantity ?? 0) === 0)
              : (p.stockQuantity ?? p.stock ?? 1) === 0;
            return (
              <div key={id} className="bestseller-card">
                <OptimizedImage
                  src={p.image || '/images/main.png'}
                  alt={name}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                  onClick={() => navigate(`/products/${href}`)}
                />
                <h3 onClick={() => navigate(`/products/${href}`)}>{name}</h3>
                <p>
                  {hasVariants && p.variants.length > 1 && <span style={{ fontWeight: 400, fontSize: 13, color: '#999' }}>From </span>}
                  ₹{displayPrice?.toFixed(2)}
                </p>
                <button
                  className="btn"
                  onClick={() => handleAdd(p)}
                  disabled={outOfStock}
                >
                  {outOfStock ? 'Out of Stock' : 'Add to Bag'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {sizeModalProduct && (
        <SizeSelectModal
          product={sizeModalProduct}
          onClose={() => setSizeModalProduct(null)}
        />
      )}
    </>
  );
}
