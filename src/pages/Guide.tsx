import { Link, useLocation } from 'react-router-dom'
import guides from '../content/guides.json'
import type { Guide } from '../content/guideTypes'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { NotFound } from './NotFound'

const GUIDES = guides as Guide[]

function guideBySlug(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug)
}

export function GuidePage() {
  const { pathname } = useLocation()
  const guide = guideBySlug(pathname.replace(/^\//, ''))
  if (!guide) return <NotFound />

  const related = guide.related
    .map((item) => guideBySlug(item))
    .filter((item): item is Guide => Boolean(item))

  return (
    <>
      <Seo
        title={guide.seoTitle}
        description={guide.seoDescription}
        path={`/${guide.slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.seoDescription,
          author: { '@type': 'Organization', name: 'Jung Functions' },
        }}
      />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">{guide.eyebrow}</p>
          <h1 className="serif-title">{guide.title}</h1>
          <p className="mono-stat">{guide.stat}</p>
          <p className="lede">{guide.lede}</p>
          {guide.sections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
          <p>
            <Button to="/quiz">Begin the quiz</Button>
          </p>
          {related.length ? (
            <nav className="guide-related" aria-label="Related guides">
              <h2>Keep reading</h2>
              <ul>
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link to={`/${item.slug}`}>{item.title}</Link>
                  </li>
                ))}
                <li>
                  <Link to="/guides">All guides</Link>
                </li>
              </ul>
            </nav>
          ) : null}
        </div>
      </article>
    </>
  )
}

export function GuidesIndex() {
  return (
    <>
      <Seo
        title="Jungian function guides | Jung Functions"
        description="Read Jung’s eight function-attitudes, how this quiz differs from MBTI, and the close pairs the items are built to separate."
        path="/guides"
      />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">guides</p>
          <h1 className="serif-title">Guides</h1>
          <p className="lede">
            Short readings of Jung’s function-attitudes, written so you can take the quiz with a
            clearer sense of what is being measured.
          </p>
          <ul className="guide-index">
            {GUIDES.map((guide) => (
              <li key={guide.slug}>
                <Link to={`/${guide.slug}`}>
                  <strong>{guide.title}</strong>
                </Link>
                <p>{guide.seoDescription}</p>
              </li>
            ))}
          </ul>
          <p>
            <Button to="/quiz">Begin the quiz</Button>
          </p>
        </div>
      </article>
    </>
  )
}
