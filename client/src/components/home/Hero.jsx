import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <div className="hero">
      <div className="hero-text">
        <h1>Products for New Moms &amp; Little Ones.</h1>
        <p>
          Empower your wellness through nature's gifts. Authentic postpartum care,
          traditionally prepared to support your fourth trimester.
        </p>
        <button className="btn" onClick={() => navigate('/products')}>
          Shop The Products
        </button>
      </div>
      <div className="hero-image" role="img" aria-label="Bananthi Mane — Natural postpartum care products for new mothers" />
    </div>
  );
}
