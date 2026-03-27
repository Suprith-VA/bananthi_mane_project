import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './BestsellerSection.css';

export default function BestsellerSection() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products?bestseller=true')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="bestsellers-section">
      <h2>Motherhood Essentials</h2>
      <div className="bestseller-grid">
        {products.map((p) => {
          const id = p._id || p.id;
          const name = p.name || p.title;
          const href = p.slug || id;
          const hasVariants = p.variants?.length > 0;
          const defaultVariant = hasVariants ? p.variants[0] : null;
          const displayPrice = defaultVariant?.price ?? p.price;
          const outOfStock = hasVariants
            ? p.variants.every(v => (v.stockQuantity ?? 0) === 0)
            : (p.stockQuantity ?? p.stock ?? 1) === 0;
          return (
            <div key={id} className="bestseller-card">
              <img
                src={p.image || '/images/main.png'}
                alt={name}
                onClick={() => navigate(`/products/${href}`)}
              />
              <h3 onClick={() => navigate(`/products/${href}`)}>{name}</h3>
              <p>
                {hasVariants && p.variants.length > 1 && <span style={{ fontWeight: 400, fontSize: 13, color: '#999' }}>From </span>}
                ₹{displayPrice?.toFixed(2)}
              </p>
              <button
                className="btn"
                onClick={() => addToCart({
                  productId: id,
                  variantId: defaultVariant?._id || defaultVariant?.id || null,
                  name,
                  unitLabel: defaultVariant?.unitLabel || null,
                  price: displayPrice,
                  image: p.image || '/images/main.png',
                })}
                disabled={outOfStock}
              >
                {outOfStock ? 'Out of Stock' : 'Add to Bag'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
