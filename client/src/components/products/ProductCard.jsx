import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const id = product._id || product.id;
  const name = product.name || product.title;
  const image = product.image || '/images/main.png';
  const href = product.slug || id;

  const hasVariants = product.variants?.length > 0;
  const lowestVariant = hasVariants
    ? product.variants.reduce((min, v) => (v.price < min.price ? v : min), product.variants[0])
    : null;
  const displayPrice = lowestVariant?.price ?? product.price;
  const outOfStock = hasVariants
    ? product.variants.every(v => (v.stockQuantity ?? 0) === 0)
    : (product.stockQuantity ?? product.stock ?? 1) === 0;

  const handleAdd = () => {
    addToCart({
      productId: id,
      variantId: lowestVariant?._id || lowestVariant?.id || null,
      name,
      unitLabel: lowestVariant?.unitLabel || null,
      price: displayPrice,
      image,
    });
  };

  return (
    <div className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-card-img-wrap" onClick={() => navigate(`/products/${href}`)}>
        <img src={image} alt={name} />
        {outOfStock && <span className="oos-overlay">Out of Stock</span>}
      </div>
      <h3 onClick={() => navigate(`/products/${href}`)}>{name}</h3>
      <p>
        {hasVariants && product.variants.length > 1 && <span className="from-label">From </span>}
        ₹{displayPrice?.toFixed(2)}
      </p>
      <button
        className="btn product-card-btn"
        onClick={handleAdd}
        disabled={outOfStock}
      >
        {outOfStock ? 'Out of Stock' : 'Add to Bag'}
      </button>
    </div>
  );
}
