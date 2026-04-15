import { Link } from 'react-router-dom';
import OptimizedImage from '../common/OptimizedImage';
import './BlogCard.css';

export default function BlogCard({ post }) {
  const href = post.slug || post._id || post.id;
  const excerpt = post.excerpt || (post.content ? post.content.substring(0, 150) + '…' : '');

  return (
    <div className="blog-card">
      <Link to={`/blog/${href}`}>
        <OptimizedImage
          src={post.featuredImage || post.image || '/images/blog_2.png'}
          alt={post.title}
          width={600}
          height={400}
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
        />
      </Link>
      <h3>
        <Link to={`/blog/${href}`}>{post.title}</Link>
      </h3>
      <p>{excerpt}</p>
      <Link to={`/blog/${href}`}>Read Article &rarr;</Link>
    </div>
  );
}
