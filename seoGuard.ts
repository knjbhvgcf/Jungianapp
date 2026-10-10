import fs from 'node:fs'
import path from 'node:path'

const ORIGIN = 'https://jungology.com'
const PUBLISHED = path.resolve(process.cwd(), 'seo/published-paths.json')
const REDIRECTS = path.resolve(process.cwd(), 'public/_redirects')

export function normalizePath(value: string) {
  const raw = value.trim()
  if (!raw || raw === '/') return '/'
  const pathname = raw.startsWith('http') ? new URL(raw).pathname : raw
  const stripped = pathname.replace(/\/+$/, '')
  return stripped.startsWith('/') ? stripped : `/${stripped}`
}

export function rememberPublishedPaths(paths: string[]) {
  const current = loadPublished()
  const next = [...new Set([...current, ...paths.map(normalizePath)])].sort((a, b) =>
    a.localeCompare(b),
  )
  if (JSON.stringify(next) === JSON.stringify(current)) return
  fs.mkdirSync(path.dirname(PUBLISHED), { recursive: true })
  fs.writeFileSync(PUBLISHED, `${JSON.stringify(next, null, 2)}\n`)
}

export function loadPublished(): string[] {
  try {
    const raw = JSON.parse(fs.readFileSync(PUBLISHED, 'utf8')) as unknown
    if (!Array.isArray(raw)) return []
    return [...new Set(raw.map((item) => normalizePath(String(item))))].sort((a, b) =>
      a.localeCompare(b),
    )
  } catch {
    return []
  }
}

function loadRedirects() {
  const map = new Map<string, { to: string; status: number }>()
  if (!fs.existsSync(REDIRECTS)) return map
  for (const line of fs.readFileSync(REDIRECTS, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('http')) continue
    const [from, to, status] = trimmed.split(/\s+/)
    if (!from || !to) continue
    const code = Number(status)
    if (code !== 301 && code !== 302) continue
    map.set(normalizePath(from), { to: normalizePath(to), status: code })
  }
  return map
}

function sitemapPaths(file: string) {
  if (!fs.existsSync(file)) return [] as string[]
  const xml = fs.readFileSync(file, 'utf8')
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => normalizePath(match[1] ?? ''))
}

function distFileFor(dist: string, pagePath: string) {
  return pagePath === '/'
    ? path.join(dist, 'index.html')
    : path.join(dist, pagePath.replace(/^\//, ''), 'index.html')
}

function hasCanonical(html: string, pagePath: string) {
  const url = `${ORIGIN}${pagePath === '/' ? '/' : pagePath}`
  return html.includes(`rel="canonical"`) && html.includes(`href="${url}"`)
}

function isNoindex(html: string) {
  const robots = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i)
  return Boolean(robots?.[1]?.toLowerCase().includes('noindex'))
}

function firstH1(html: string) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  return match?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() ?? ''
}

export function checkSeo(dist = path.resolve(process.cwd(), 'dist')) {
  const errors: string[] = []
  const published = loadPublished()
  const redirects = loadRedirects()
  const sitemap = sitemapPaths(path.join(dist, 'sitemap.xml'))
  rememberPublishedPaths(sitemap)

  if (!published.length) {
    errors.push('seo/published-paths.json is empty. That file is the list of URLs that must stay live.')
  }

  const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8')
  if (!/^\s*User-agent:\s*\*/im.test(robots) || !/^\s*Allow:\s*\/\s*$/im.test(robots)) {
    errors.push('robots.txt must keep Allow: / for all crawlers.')
  }
  if (!robots.includes(`${ORIGIN}/sitemap.xml`)) {
    errors.push('robots.txt must keep Sitemap: https://jungology.com/sitemap.xml')
  }
  if (/^\s*Disallow:\s*\/\s*$/im.test(robots)) {
    errors.push('robots.txt must not Disallow: /')
  }

  for (const pagePath of published) {
    const redirect = redirects.get(pagePath)
    if (redirect) continue
    if (!sitemap.includes(pagePath)) {
      errors.push(
        `${pagePath} was already published, but it is missing from the sitemap and has no 301 in public/_redirects. Add a redirect before removing it.`,
      )
      continue
    }
    const file = distFileFor(dist, pagePath)
    if (!fs.existsSync(file)) {
      errors.push(`${pagePath} is in the sitemap but was not prerendered to ${path.relative(process.cwd(), file)}.`)
      continue
    }
    const html = fs.readFileSync(file, 'utf8')
    if (isNoindex(html)) {
      errors.push(`${pagePath} is prerendered with noindex. Indexed URLs must stay index,follow.`)
    }
    if (!hasCanonical(html, pagePath)) {
      errors.push(`${pagePath} is missing a self-canonical to ${ORIGIN}${pagePath === '/' ? '/' : pagePath}.`)
    }
    if (!/<h1[\s>]/i.test(html)) {
      errors.push(`${pagePath} has no H1 in the prerendered HTML.`)
    }
  }

  const homeH1 = firstH1(fs.readFileSync(distFileFor(dist, '/'), 'utf8'))

  for (const pagePath of sitemap) {
    const file = distFileFor(dist, pagePath)
    if (!fs.existsSync(file)) {
      errors.push(`Sitemap URL ${pagePath} has no prerendered HTML.`)
      continue
    }
    const html = fs.readFileSync(file, 'utf8')
    if (isNoindex(html)) {
      errors.push(`Sitemap URL ${pagePath} is marked noindex.`)
    }
    if (!hasCanonical(html, pagePath)) {
      errors.push(`Sitemap URL ${pagePath} is missing a self-canonical.`)
    }
    if (!/<h1[\s>]/i.test(html)) {
      errors.push(`Sitemap URL ${pagePath} has no H1 in the prerendered HTML.`)
    }
    const heading = firstH1(html)
    if (pagePath !== '/' && homeH1 && heading === homeH1) {
      errors.push(`${pagePath} prerendered with the homepage H1 (“${homeH1}”).`)
    }
    if (
      pagePath === '/jungian-cognitive-functions-test' &&
      !/jungian cognitive functions test/i.test(heading)
    ) {
      errors.push(`${pagePath} H1 must be the keyword, not “${heading}”.`)
    }
  }

  if (errors.length) {
    throw new Error(`SEO guard failed. A push with these problems can drop rankings.\n- ${errors.join('\n- ')}`)
  }
}
