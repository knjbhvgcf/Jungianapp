import type { Guide } from '../content/guideTypes'

export const RESERVED_SLUGS = new Set([
  'quiz',
  'clarify',
  'results',
  'dossier',
  'type-in-depth',
  'compatibility',
  'about',
  'admin',
  'guides',
  'assets',
  'types',
])

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'new-article'
}

export function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !RESERVED_SLUGS.has(slug)
}

export function emptyGuide(existing: Guide[]): Guide {
  const used = new Set(existing.map((guide) => guide.slug))
  let slug = slugify('new article')
  let index = 2
  while (used.has(slug)) {
    slug = `new-article-${index}`
    index += 1
  }
  return {
    slug,
    seoTitle: 'New article | Jung Functions',
    seoDescription: '',
    eyebrow: 'guide',
    title: 'New article',
    stat: '',
    lede: '',
    sections: [{ heading: 'Introduction', paragraphs: [''] }],
    related: [],
  }
}
