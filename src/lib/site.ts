export const SITE_BRAND = 'Jungology'
export const SITE_SEO_NAME = 'Jung Functions Quiz'
export const SITE_ORIGIN = 'https://jungology.com'
export const SITE_OG_IMAGE = '/og.jpg'

/** Cloudflare Pages serves prerendered folders at a trailing slash. Canonicals must match that 200 URL. */
export function canonicalPath(path: string) {
  const raw = path.trim() || '/'
  const withLead = raw.startsWith('/') ? raw : `/${raw}`
  if (withLead === '/') return '/'
  return withLead.endsWith('/') ? withLead : `${withLead}/`
}

export function canonicalUrl(path: string) {
  return `${SITE_ORIGIN}${canonicalPath(path)}`
}
