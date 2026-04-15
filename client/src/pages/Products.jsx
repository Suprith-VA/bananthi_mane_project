import { useState, useEffect, useMemo } from 'react';
import SEOHead from '../components/seo/SEOHead';
import ProductCard from '../components/products/ProductCard';
import './Products.css';

const CATEGORIES = [
  { key: 'all', label: 'All Products' },
  { key: 'Cold Pressed Oil', label: 'Cold Pressed Oil' },
  { key: 'Organic Powders', label: 'Organic Powders' },
  { key: 'Homemade Pudi', label: 'Homemade Pudi' },
  { key: 'Other', label: 'Other' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  // Derive which category chips to show (only ones that have products)
  const availableCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return CATEGORIES.filter(c => c.key === 'all' || cats.has(c.key));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, activeCategory]);

  const categoryCount = (key) => {
    if (key === 'all') return products.length;
    return products.filter(p => p.category === key).length;
  };

  return (
    <main className="page-enter">
      <SEOHead
        title="Products"
        description="Browse handcrafted cold-pressed oils, organic powders, and homemade pudi for postpartum care. 100% natural, no preservatives — ships pan India."
        canonical="/products"
      />
      <div className="page-header">
        <h1>All Products</h1>
        <p>Traditional remedies crafted for postpartum healing.</p>
      </div>

      {/* ── Category Filter ─── */}
      <div className="category-filter-bar">
        {availableCategories.map(c => (
          <button
            key={c.key}
            className={`category-chip ${activeCategory === c.key ? 'active' : ''}`}
            onClick={() => { setActiveCategory(c.key); setSearch(''); }}
          >
            {c.label}
            <span className="category-count">{categoryCount(c.key)}</span>
          </button>
        ))}
      </div>

      {/* ── Search ─── */}
      <div className="products-search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search products… e.g. oil, powder, ghee"
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCategory('all'); }}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
          )}
        </div>
        {(search || activeCategory !== 'all') && (
          <p className="search-results-count">
            {filtered.length === 0
              ? `No products found${search ? ` for "${search}"` : ''}.`
              : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {loading ? (
        <div className="products-loading">Loading products…</div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard key={p._id || p.id} product={p} />
          ))}
          {filtered.length === 0 && !loading && (
            <div className="products-empty col-span-all">No products found.</div>
          )}
        </div>
      )}
    </main>
  );
}
