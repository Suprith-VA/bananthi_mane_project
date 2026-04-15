import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../common/OptimizedImage';
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
      <OptimizedImage
        src="/images/main.png"
        alt="Bananthi Mane — Natural postpartum care products for new mothers"
        className="hero-image"
        width={800}
        height={600}
        sizes="(max-width: 768px) 100vw, 55vw"
        loading="eager"
        fetchPriority="high"
      />
    </div>
  );
}
