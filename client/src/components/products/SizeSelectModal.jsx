import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import './SizeSelectModal.css';

export default function SizeSelectModal({ product, onClose }) {
  const { addToCart } = useCart();

  const id = product._id || product.id;
  const name = product.name || product.title;
  const image = product.image || '/images/main.png';
  const variants = product.variants || [];

  // Default to first in-stock variant
  const firstInStock = variants.find(v => (v.stockQuantity ?? 0) > 0) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState(firstInStock);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const activePrice = selectedVariant?.price ?? product.price;
  const outOfStock = selectedVariant ? (selectedVariant.stockQuantity ?? 0) === 0 : true;

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart({
      productId: id,
      variantId: selectedVariant?._id || selectedVariant?.id || null,
      name,
      unitLabel: selectedVariant?.unitLabel || null,
      price: activePrice,
      image,
    });
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
      onClose();
    }, 900);
  };

  return (
    <div className="ssm-overlay" onClick={onClose}>
      <div className="ssm-modal" onClick={e => e.stopPropagation()}>
        <button className="ssm-close" onClick={onClose} aria-label="Close">×</button>

        <div className="ssm-body">
          <div className="ssm-image-wrap">
            <img src={image} alt={name} />
          </div>

          <div className="ssm-info">
            <h3 className="ssm-name">{name}</h3>
            <div className="ssm-price">₹{activePrice?.toFixed(2)}</div>

            {variants.length > 0 && (
              <div className="ssm-variants">
                <p className="ssm-variants-label">Select Size</p>
                <div className="ssm-variant-pills">
                  {variants.map(v => {
                    const vid = v._id || v.id;
                    const isSelected = (selectedVariant?._id || selectedVariant?.id) === vid;
                    const isOos = (v.stockQuantity ?? 0) === 0;
                    return (
                      <button
                        key={vid}
                        className={`ssm-pill ${isSelected ? 'active' : ''} ${isOos ? 'oos' : ''}`}
                        onClick={() => !isOos && setSelectedVariant(v)}
                        disabled={isOos}
                        title={isOos ? 'Out of stock' : `₹${v.price}`}
                      >
                        {v.unitLabel}
                        <span className="ssm-pill-price">₹{v.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              className={`btn ssm-add-btn ${addedFeedback ? 'added' : ''}`}
              onClick={handleAdd}
              disabled={outOfStock}
            >
              {outOfStock ? 'Out of Stock' : addedFeedback ? 'Added to Bag ✓' : 'Add to Bag'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
