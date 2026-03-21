import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const id = product._id || product.id;
  const name = product.name || product.title;
  const price = product.price;
  const image = product.image || '/images/main.png';
  const outOfStock = (product.stockQuantity ?? product.stock ?? 1) === 0;
  // Prefer slug for SEO-friendly URL; fall back to id
  const href = product.slug || id;

  return (
    <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-card-img-wrap" onClick={() => navigate(`/products/${href}`)}>
        <img src={image} alt={name} />
        {outOfStock && <span className="oos-overlay">Out of Stock</span>}
      </div>
      <h3 onClick={() => navigate(`/products/${href}`)}>{name}</h3>
      <p>₹{price?.toFixed(2)}</p>
      <button
        className="btn product-card-btn"
        onClick={() => addToCart(name, price)}
        disabled={outOfStock}
      >
        {outOfStock ? 'Out of Stock' : 'Add to Bag'}
      </button>
    </div>
  );
}
