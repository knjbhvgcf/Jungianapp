import fs from 'node:fs'
import path from 'node:path'

const CORE = [
  { loc: '/', priority: '1.0' },
  { loc: '/quiz', priority: '0.8' },
  { loc: '/types', priority: '0.8' },
  { loc: '/type-in-depth', priority: '0.5' },
  { loc: '/compatibility', priority: '0.5' },
  { loc: '/about', priority: '0.6' },
  { loc: '/legal', priority: '0.4' },
  { loc: '/guides', priority: '0.7' },
]

function typeCodes() {
  try {
    const types = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'src/content/types.json'), 'utf8'),
    ) as { code?: string }[]
    return types.map((type) => String(type.code ?? '').toLowerCase()).filter(Boolean)
  } catch {
    return []
  }
}

export function writeSitemap(guideSlugs: string[], dest = 'public/sitemap.xml') {
  const origin = 'https://jungology.com'
  const urls = [
    ...CORE,
    ...typeCodes().map((code) => ({ loc: `/types/${code}`, priority: '0.7' })),
    ...guideSlugs.map((slug) => ({ loc: `/${slug}`, priority: '0.7' })),
  ]
  const body = urls
    .map(
      (url) => `  <url>
    <loc>${origin}${url.loc === '/' ? '/' : url.loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
    )
    .join('\n')
  fs.writeFileSync(
    path.resolve(process.cwd(), dest),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
  )
}
