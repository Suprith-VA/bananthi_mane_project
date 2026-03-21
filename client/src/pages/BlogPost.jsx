import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './BlogPost.css';

export default function BlogPost() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/blogs/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setPost(data); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="page-enter blog-post-page">
        <div style={{ textAlign: 'center', padding: '6rem', color: '#888' }}>Loading article…</div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="page-enter blog-post-page">
        <div className="page-header"><h1>Article not found</h1></div>
        <Link className="btn" to="/blog">Back to Blog</Link>
      </main>
    );
  }

  // Content may be a string (DB) or array of paragraphs (legacy static)
  const paragraphs = Array.isArray(post.content)
    ? post.content
    : post.content?.split('\n\n').filter(Boolean) ?? [];

  return (
    <main className="page-enter blog-post-page">
      <Link to="/blog" className="blog-post-back">← Back to Blog</Link>
      <article className="blog-post-article">
        {(post.featuredImage || post.image) && (
          <img
            src={post.featuredImage || post.image}
            alt={post.title}
            className="blog-post-image"
          />
        )}
        <h1>{post.title}</h1>
        {post.publishedAt && (
          <p className="blog-post-date">
            {new Date(post.publishedAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
        {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
      </article>
    </main>
  );
}
