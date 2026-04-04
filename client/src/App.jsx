import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CommunityBanner from './components/layout/CommunityBanner';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Services from './pages/Services';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import TrackOrder from './pages/TrackOrder';
import About from './pages/About';
import FAQ from './pages/FAQ';
import ReturnPolicy from './pages/ReturnPolicy';
import ResetPassword from './pages/ResetPassword';
import Checkout from './pages/Checkout';
import Partnership from './pages/Partnership';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import ShippingPolicy from './pages/ShippingPolicy';

import './styles/globals.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function AppShell() {
  return (
    <>
      <ScrollToTop />
      <Header />

      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/products"      element={<Products />} />
        <Route path="/products/:id"  element={<ProductDetail />} />
        <Route path="/cart"          element={<Cart />} />
        <Route path="/checkout"      element={<Checkout />} />
        <Route path="/services"      element={<Services />} />
        <Route path="/blog"          element={<Blog />} />
        <Route path="/blog/:id"      element={<BlogPost />} />
        <Route path="/contact"       element={<Contact />} />
        <Route path="/admin"         element={<AdminDashboard />} />
        <Route path="/profile"       element={<Profile />} />
        <Route path="/orders"        element={<OrderHistory />} />
        <Route path="/track-order"   element={<TrackOrder />} />
        <Route path="/about"         element={<About />} />
        <Route path="/faq"           element={<FAQ />} />
        <Route path="/return-policy"              element={<ReturnPolicy />} />
        <Route path="/cancellation-refund-policy" element={<ReturnPolicy />} />
        <Route path="/privacy-policy"             element={<PrivacyPolicy />} />
        <Route path="/terms-conditions"           element={<TermsConditions />} />
        <Route path="/shipping-policy"            element={<ShippingPolicy />} />
        <Route path="/reset-password/:token"      element={<ResetPassword />} />
        <Route path="/partnership"   element={<Partnership />} />
      </Routes>

      <CommunityBanner />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
          <Analytics />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
