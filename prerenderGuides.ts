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

type TypePage = {
  code: string
  title: string
  name: string
  stack: string[]
  summary: string
  image?: string
}

const STACK_LABELS = ['Hero', 'Parent', 'Child', 'Inferior']

function typeCard(type: TypePage) {
  const img = type.image
    ? `<img src="${escapeHtml(type.image)}" alt="" class="sketch type-portrait sketch--mini">`
    : ''
  return `<li><a href="/types/${type.code.toLowerCase()}">${img}<strong>${escapeHtml(type.code)}</strong><span>${escapeHtml(type.title)}</span></a></li>`
}

function typesIndexHtml(types: TypePage[]) {
  return `<article class="section"><div class="wrap prose"><p class="eyebrow">types</p><h1 class="serif-title">Sixteen types</h1><p class="lede">Each pattern is a leading function and the function that supports it, named here as a character you can meet before you take the quiz, or after, if you want a page you can keep.</p><ul class="type-index">${types.map(typeCard).join('')}</ul><p><a href="/quiz">Begin the quiz</a></p></div></article>`
}

function typePageHtml(type: TypePage, types: TypePage[]) {
  const stack = type.stack
    .map(
      (id, index) =>
        `<li><span class="archetype-stack__label">${STACK_LABELS[index] ?? ''}</span><span>${escapeHtml(id)}</span></li>`,
    )
    .join('')
  const img = type.image
    ? `<img src="${escapeHtml(type.image)}" alt="${escapeHtml(`${type.code} ${type.title}`)}" class="sketch type-portrait">`
    : ''
  const others = types.filter((item) => item.code !== type.code).map(typeCard).join('')
  return `<article class="section type-page"><header class="wrap screen dossier-hero">${img}<p class="eyebrow">type</p><h1 class="serif-title">${escapeHtml(type.code)} — ${escapeHtml(type.title)}</h1><p class="mono-stat">${escapeHtml(type.code.toLowerCase())} · ${escapeHtml(type.name.toLowerCase())}</p><p class="lede">${escapeHtml(type.summary)}</p><p><a href="/quiz">Begin the quiz</a> · <a href="/types">All types</a></p></header><div class="wrap prose"><h2>Cognitive stack</h2><ul class="archetype-stack">${stack}</ul></div><div class="wrap prose"><h2>The others</h2><ul class="type-index">${others}</ul></div></article>`
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

      const types = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'src/content/types.json'), 'utf8'),
      ) as TypePage[]

      writePage(
        'types',
        'Sixteen types | Jung Functions',
        'Browse the sixteen Jungian type patterns this quiz names, each with a portrait, stack, and a short reading.',
        typesIndexHtml(types),
      )

      for (const type of types) {
        writePage(
          `types/${type.code.toLowerCase()}`,
          `${type.code} ${type.title} | Jung Functions`,
          type.summary,
          typePageHtml(type, types),
        )
      }

      writeSitemap(
        guides.map((guide) => guide.slug),
        path.join(dist, 'sitemap.xml'),
      )
    },
  }
}
