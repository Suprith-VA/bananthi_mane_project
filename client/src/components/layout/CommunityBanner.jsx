import { useNavigate } from 'react-router-dom';
import './CommunityBanner.css';

export default function CommunityBanner() {
  const navigate = useNavigate();

  const handleShopNow = () => {
    navigate('/products');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  return (
    <div className="community-banner">
      <h2>Empower your wellness through nature's gifts.</h2>
      <button className="btn banner-btn" onClick={handleShopNow}>
        Shop Now
      </button>
    </div>
  );
}
