import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OptimizedImage from '../common/OptimizedImage';
import './FeaturedJournal.css';

const FALLBACK_IMAGE = '/images/blog_2.png';
const FALLBACK_TITLE = 'The Golden Window of Recovery';
const FALLBACK_EXCERPT =
  'Understanding the vital importance of the first 40 days postpartum. Discover why deep rest, warm nutrition, and traditional care are essential for long-term healing.';

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

  const imageUrl = post?.featuredImage || FALLBACK_IMAGE;
  const title = post?.title || FALLBACK_TITLE;
  const excerpt = post
    ? (post.excerpt || post.content?.substring(0, 180) + '…')
    : FALLBACK_EXCERPT;
  const href = post?.slug || post?._id;

  return (
    <div className="featured-journal-home">
      <OptimizedImage
        src={imageUrl}
        alt={title}
        className="fj-image"
        width={800}
        height={500}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
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
