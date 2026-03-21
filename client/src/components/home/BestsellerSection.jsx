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
          const outOfStock = (p.stockQuantity ?? p.stock ?? 1) === 0;
          return (
            <div key={id} className="bestseller-card">
              <img
                src={p.image || '/images/main.png'}
                alt={name}
                onClick={() => navigate(`/products/${href}`)}
              />
              <h3 onClick={() => navigate(`/products/${href}`)}>{name}</h3>
              <p>₹{p.price?.toFixed(2)}</p>
              <button
                className="btn"
                onClick={() => addToCart(name, p.price)}
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
