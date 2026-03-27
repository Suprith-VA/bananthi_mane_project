import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

export default function Cart() {
  const { cart, addToCart, removeOne, removeAll, totalItems, totalPrice } = useCart();

  return (
    <main className="page-enter cart-page">
      <div className="page-header">
        <h1>Your Cart</h1>
      </div>

      {totalItems === 0 ? (
        <div className="cart-empty-state">
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn">Continue Shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-page-items">
            {Object.entries(cart).map(([key, item]) => (
              <div key={key} className="cart-page-item">
                <div>
                  <p className="cart-page-item-name">{item.name}</p>
                  {item.unitLabel && (
                    <p className="cart-page-item-unit">{item.unitLabel}</p>
                  )}
                  <p className="cart-page-item-price">Rs. {item.price.toFixed(2)}</p>
                </div>

                <div className="cart-page-actions">
                  <div className="cart-page-qty-controls">
                    <button className="cart-page-qty-btn" onClick={() => removeOne(key)}>−</button>
                    <span>{item.quantity}</span>
                    <button className="cart-page-qty-btn" onClick={() => addToCart(item)}>+</button>
                  </div>
                  <button className="cart-page-remove" onClick={() => removeAll(key)}>
                    Remove
                  </button>
                  <span className="cart-page-line-total">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-page-summary">
            <div className="cart-page-summary-row">
              <span>Estimated total</span>
              <span>Rs. {totalPrice.toFixed(2)}</span>
            </div>
            <p>Taxes and shipping calculated at checkout.</p>
            <button className="btn" onClick={() => alert('Proceeding to secure checkout...')}>
              Check out
            </button>
          </div>
        </>
      )}
    </main>
  );
}
