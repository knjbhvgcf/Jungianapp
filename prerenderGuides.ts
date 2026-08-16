import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { writeSitemap } from './sitemap.ts'

type Guide = {
  slug: string
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  stat: string
  lede: string
  sections: { heading: string; paragraphs: string[] }[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function articleHtml(guide: Guide) {
  const sections = guide.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>${section.paragraphs
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join('')}`,
    )
    .join('')

  return `<article class="section"><div class="wrap prose"><p class="eyebrow">${escapeHtml(guide.eyebrow)}</p><h1 class="serif-title">${escapeHtml(guide.title)}</h1><p class="mono-stat">${escapeHtml(guide.stat)}</p><p class="lede">${escapeHtml(guide.lede)}</p>${sections}<p><a href="/quiz">Begin the quiz</a></p></div></article>`
}

function indexHtml(guides: Guide[]) {
  const items = guides
    .map(
      (guide) =>
        `<li><a href="/${guide.slug}"><strong>${escapeHtml(guide.title)}</strong></a><p>${escapeHtml(guide.seoDescription)}</p></li>`,
    )
    .join('')
  return `<article class="section"><div class="wrap prose"><p class="eyebrow">guides</p><h1 class="serif-title">Guides</h1><p class="lede">Short readings of Jung’s function-attitudes, written so you can take the quiz with a clearer sense of what is being measured.</p><ul>${items}</ul><p><a href="/quiz">Begin the quiz</a></p></div></article>`
}

function applyShell(template: string, title: string, description: string, body: string) {
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"/,
      `<meta name="description" content="${escapeHtml(description)}"`,
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"/,
      `<meta property="og:title" content="${escapeHtml(title)}"`,
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"/,
      `<meta property="og:description" content="${escapeHtml(description)}"`,
    )
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

export function prerenderGuidesPlugin(): Plugin {
  return {
    name: 'prerender-guides',
    closeBundle() {
      const dist = path.resolve(process.cwd(), 'dist')
      const indexPath = path.join(dist, 'index.html')
      if (!fs.existsSync(indexPath)) return

      const template = fs.readFileSync(indexPath, 'utf8')
      const guides = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'src/content/guides.json'), 'utf8'),
      ) as Guide[]

      const writePage = (slug: string, title: string, description: string, body: string) => {
        const dir = path.join(dist, slug)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), applyShell(template, title, description, body))
      }

      writePage(
        'guides',
        'Jungian function guides | Jung Functions',
        'Read Jung’s eight function-attitudes, how this quiz differs from MBTI, and the close pairs the items are built to separate.',
        indexHtml(guides),
      )

      for (const guide of guides) {
        writePage(guide.slug, guide.seoTitle, guide.seoDescription, articleHtml(guide))
      }

      writeSitemap(
        guides.map((guide) => guide.slug),
        path.join(dist, 'sitemap.xml'),
      )
    },
  }
}
