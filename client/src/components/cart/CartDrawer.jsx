import { useCart } from '../../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { cart, addToCart, removeOne, removeAll, totalItems, totalPrice, isOpen, setIsOpen } = useCart();

  return (
    <>
      {isOpen && <div className="cart-overlay" onClick={() => setIsOpen(false)} />}

      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-cart" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="cart-items">
          {totalItems === 0 ? (
            <p className="cart-empty">Your cart is empty</p>
          ) : (
            Object.entries(cart).map(([name, { price, quantity }]) => (
              <div key={name} className="cart-item">
                <div className="cart-item-info">
                  <p className="cart-item-name">{name}</p>
                  <p className="cart-item-price">Rs. {price.toFixed(2)}</p>
                  <div className="cart-qty-controls">
                    <button className="cart-qty-btn" onClick={() => removeOne(name)}>−</button>
                    <span className="cart-qty-val">{quantity}</span>
                    <button className="cart-qty-btn" onClick={() => addToCart(name, price)}>+</button>
                  </div>
                </div>
                <div className="cart-item-right">
                  <button className="cart-trash-btn" onClick={() => removeAll(name)} aria-label="Remove">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                  <span className="cart-item-total">Rs. {(price * quantity).toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total-row">
            <span>Estimated total</span>
            <span>Rs. {totalPrice.toFixed(2)}</span>
          </div>
          <p className="cart-note">Taxes and shipping calculated at checkout.</p>
          <button className="btn" style={{ width: '100%' }} onClick={() => alert('Proceeding to secure checkout...')}>
            Check out
          </button>
        </div>
      </div>
    </>
  );
}
