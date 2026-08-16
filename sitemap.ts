import fs from 'node:fs'
import path from 'node:path'

const CORE = [
  { loc: '/', priority: '1.0' },
  { loc: '/quiz', priority: '0.8' },
  { loc: '/dossier', priority: '0.5' },
  { loc: '/compatibility', priority: '0.5' },
  { loc: '/about', priority: '0.6' },
  { loc: '/guides', priority: '0.7' },
]

export function writeSitemap(guideSlugs: string[], dest = 'public/sitemap.xml') {
  const origin = 'https://YOUR_DOMAIN'
  const urls = [
    ...CORE,
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
