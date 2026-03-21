import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturedJournal.css';

export default function FeaturedJournal() {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetch('/api/blogs?featured=true')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setPost(data[0]);
      })
      .catch(() => {});
  }, []);

  const href = post?.slug || post?._id;
  const title = post?.title || 'The Golden Window of Recovery';
  const excerpt = post
    ? (post.excerpt || post.content?.substring(0, 180) + '…')
    : 'Understanding the vital importance of the first 40 days postpartum. Discover why deep rest, warm nutrition, and traditional care are essential for long-term healing.';

  return (
    <div className="featured-journal-home">
      <div className="fj-image" />
      <div className="fj-content">
        <p className="label">The Motherhood Blog</p>
        <h2>{title}</h2>
        <p className="excerpt">{excerpt}</p>
        <button
          className="btn fj-btn"
          onClick={() => navigate(href ? `/blog/${href}` : '/blog')}
        >
          Read Article
        </button>
      </div>
    </div>
  );
}
