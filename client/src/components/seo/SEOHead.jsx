import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Bananthi Mane';
const BASE_URL = 'https://www.bananthimane.com';
const DEFAULT_DESCRIPTION =
  'Bananthi Mane offers handcrafted cold-pressed oils, organic powders, and homemade pudi for postpartum mothers and families. 100% natural, traditionally prepared. Ships Pan India.';
const DEFAULT_IMAGE = `${BASE_URL}/logo.png`;

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  ogImageWidth = '512',
  ogImageHeight = '512',
  noIndex = false,
  structuredData,
  children,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Natural Postpartum & Wellness Products`;
  const canonicalUrl = canonical
    ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`)
    : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content={ogImageWidth} />
      <meta property="og:image:height" content={ogImageHeight} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={ogImage === DEFAULT_IMAGE ? 'summary' : 'summary_large_image'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {children}
    </Helmet>
  );
}

export { SITE_NAME, BASE_URL, DEFAULT_DESCRIPTION, DEFAULT_IMAGE };
