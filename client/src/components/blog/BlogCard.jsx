import { Link } from 'react-router-dom';
import './BlogCard.css';

export default function BlogCard({ post }) {
  // DB posts use slug for URL; legacy static posts use numeric id
  const href = post.slug || post._id || post.id;
  const excerpt = post.excerpt || (post.content ? post.content.substring(0, 150) + '…' : '');

  return (
    <div className="blog-card">
      <Link to={`/blog/${href}`}>
        <img src={post.featuredImage || post.image || '/images/blog_2.png'} alt={post.title} />
      </Link>
      <h3>
        <Link to={`/blog/${href}`}>{post.title}</Link>
      </h3>
      <p>{excerpt}</p>
      <Link to={`/blog/${href}`}>Read Article &rarr;</Link>
    </div>
  );
}
