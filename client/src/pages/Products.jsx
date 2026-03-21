import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/products/ProductCard';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <main className="page-enter">
      <div className="page-header">
        <h1>All Products</h1>
        <p>Traditional remedies crafted for postpartum healing.</p>
      </div>

      <div className="products-search-bar">
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search products… e.g. oil, powder, ghee"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">×</button>
          )}
        </div>
        {search && (
          <p className="search-results-count">
            {filtered.length === 0
              ? 'No products match your search.'
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
            <div className="products-empty">No products found for "{search}".</div>
          )}
        </div>
      )}
    </main>
  );
}
