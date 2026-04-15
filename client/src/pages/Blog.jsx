import { useState, useEffect } from 'react';
import SEOHead from '../components/seo/SEOHead';
import BlogCard from '../components/blog/BlogCard';
import './Blog.css';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blogs')
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-enter">
      <SEOHead
        title="The Motherhood Blog"
        description="Stories, wisdom, and practical guides for the postpartum journey. Evidence-based wellness advice for new mothers."
        canonical="/blog"
      />
      <div className="page-header">
        <h1>The Motherhood Blog</h1>
        <p>Stories, wisdom, and practical guides for the postpartum journey.</p>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>Loading articles…</div>
      ) : (
        <div className="blog-grid">
          {posts.map(post => (
            <BlogCard key={post._id || post.id} post={post} />
          ))}
          {posts.length === 0 && <p style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>No articles published yet.</p>}
        </div>
      )}
    </main>
  );
}
