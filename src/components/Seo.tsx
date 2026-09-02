import { useEffect } from 'react'

type SeoProps = {
  title: string
  description: string
  path?: string
  jsonLd?: Record<string, unknown>
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export function Seo({ title, description, path = '/', jsonLd }: SeoProps) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    const host = window.location.hostname
    const origin =
      host === 'localhost' || host === '127.0.0.1'
        ? window.location.origin
        : 'https://jungology.com'
    const url = `${origin}${path}`

    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url

    const existing = document.getElementById('page-jsonld')
    if (existing) existing.remove()
    if (jsonLdKey) {
      const script = document.createElement('script')
      script.id = 'page-jsonld'
      script.type = 'application/ld+json'
      script.textContent = jsonLdKey
      document.head.appendChild(script)
    }
  }, [title, description, path, jsonLdKey])

  return null
}
