const CLOUDINARY_REGEX = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.*)/;

function buildCloudinaryUrl(src, transforms) {
  const match = src.match(CLOUDINARY_REGEX);
  if (!match) return src;
  const [, cloud, rest] = match;
  const path = rest.replace(/^v\d+\//, '');
  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms.join(',')}/${path}`;
}

function cloudinarySrcSet(src, widths) {
  if (!CLOUDINARY_REGEX.test(src)) return undefined;
  return widths
    .map(w => `${buildCloudinaryUrl(src, [`w_${w}`, 'f_auto', 'q_auto'])} ${w}w`)
    .join(', ');
}

const DEFAULT_WIDTHS = [320, 480, 640, 800, 1024, 1280];

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  style,
  loading = 'lazy',
  fetchPriority,
  onClick,
  widths = DEFAULT_WIDTHS,
  ...rest
}) {
  const isCloudinary = CLOUDINARY_REGEX.test(src || '');
  const optimizedSrc = isCloudinary
    ? buildCloudinaryUrl(src, ['f_auto', 'q_auto'])
    : src;
  const srcSet = isCloudinary ? cloudinarySrcSet(src, widths) : undefined;

  return (
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt || ''}
      width={width}
      height={height}
      className={className}
      style={style}
      loading={loading}
      fetchpriority={fetchPriority}
      onClick={onClick}
      {...rest}
    />
  );
}
