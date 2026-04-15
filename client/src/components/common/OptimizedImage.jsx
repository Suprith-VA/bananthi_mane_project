import { useState, useRef, useEffect } from 'react';

const CLOUDINARY_REGEX = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.*)/;

function buildCloudinaryUrl(src, transforms) {
  const match = src.match(CLOUDINARY_REGEX);
  if (!match) return src;
  const [, cloud, rest] = match;
  const existing = rest.replace(/^v\d+\//, '');
  const txString = transforms.join(',');
  return `https://res.cloudinary.com/${cloud}/image/upload/${txString}/${existing}`;
}

function cloudinarySrcSet(src, widths) {
  if (!CLOUDINARY_REGEX.test(src)) return undefined;
  return widths
    .map(w => {
      const url = buildCloudinaryUrl(src, [`w_${w}`, 'f_auto', 'q_auto']);
      return `${url} ${w}w`;
    })
    .join(', ');
}

function blurPlaceholderUrl(src) {
  if (!CLOUDINARY_REGEX.test(src)) return undefined;
  return buildCloudinaryUrl(src, ['w_40', 'q_10', 'f_auto', 'e_blur:800']);
}

const DEFAULT_WIDTHS = [320, 480, 640, 800, 1024, 1280];

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className = '',
  style = {},
  loading = 'lazy',
  fetchPriority,
  onClick,
  widths = DEFAULT_WIDTHS,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(loading === 'eager');
  const containerRef = useRef(null);

  useEffect(() => {
    if (loading === 'eager') { setInView(true); return; }
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  const isCloudinary = CLOUDINARY_REGEX.test(src || '');
  const placeholder = isCloudinary ? blurPlaceholderUrl(src) : undefined;
  const srcSet = isCloudinary ? cloudinarySrcSet(src, widths) : undefined;
  const optimizedSrc = isCloudinary
    ? buildCloudinaryUrl(src, ['f_auto', 'q_auto'])
    : src;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onClick={onClick}
    >
      {placeholder && !loaded && (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      {inView && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt || ''}
          width={width}
          height={height}
          loading={loading}
          fetchpriority={fetchPriority}
          onLoad={() => setLoaded(true)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded || !placeholder ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          {...rest}
        />
      )}
    </div>
  );
}
