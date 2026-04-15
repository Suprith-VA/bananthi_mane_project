import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEOHead from '../components/seo/SEOHead';
import { BASE_URL } from '../components/seo/SEOHead';
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

  const paragraphs = Array.isArray(post.content)
    ? post.content
    : post.content?.split('\n\n').filter(Boolean) ?? [];

  const blogPostSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content?.substring(0, 160) || '',
    image: post.featuredImage || post.image || '',
    url: `${BASE_URL}/blog/${post.slug || post._id || post.id}`,
    datePublished: post.publishedAt || post.createdAt,
    author: { '@type': 'Organization', name: 'Bananthi Mane' },
    publisher: {
      '@type': 'Organization',
      name: 'Bananthi Mane',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
  };

  return (
    <main className="page-enter blog-post-page">
      <SEOHead
        title={post.title}
        description={post.excerpt || post.content?.substring(0, 160) || `Read "${post.title}" on the Bananthi Mane Motherhood Blog.`}
        canonical={`/blog/${post.slug || post._id || post.id}`}
        ogType="article"
        ogImage={post.featuredImage || post.image || undefined}
        structuredData={blogPostSchema}
      />
      <Link to="/blog" className="blog-post-back">← Back to Blog</Link>
      <article className="blog-post-article">
        {(post.featuredImage || post.image) && (
          <img
            src={post.featuredImage || post.image}
            alt={post.title}
            className="blog-post-image"
            loading="lazy"
            width="800"
            height="450"
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
