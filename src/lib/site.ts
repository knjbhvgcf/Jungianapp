export const SITE_BRAND = 'Jungology'
export const SITE_SEO_NAME = 'Jung Functions Quiz'
export const SITE_ORIGIN = 'https://jungology.com'
export const SITE_OG_IMAGE = '/og.jpg'

function withLeadingSlash(path: string) {
  const raw = path.trim() || '/'
  return raw.startsWith('/') ? raw : `/${raw}`
}

/** Path used to look up a page. Cloudflare serves prerendered folders with a trailing slash. */
export function routePath(path: string) {
  const withLead = withLeadingSlash(path)
  if (withLead === '/') return '/'
  return withLead.replace(/\/+$/, '')
}

/** Cloudflare Pages serves prerendered folders at a trailing slash. Canonicals must match that 200 URL. */
export function canonicalPath(path: string) {
  const clean = routePath(path)
  return clean === '/' ? '/' : `${clean}/`
}

export function canonicalUrl(path: string) {
  return `${SITE_ORIGIN}${canonicalPath(path)}`
}
