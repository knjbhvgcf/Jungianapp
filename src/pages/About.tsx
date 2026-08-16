import pages from '../content/pages.json'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import type { PagesContent } from '../content/schema'

const { about } = pages as PagesContent

export function About() {
  return (
    <>
      <Seo title={about.seoTitle} description={about.seoDescription} path="/about" />

      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">{about.eyebrow}</p>
          <h1 className="serif-title">{about.title}</h1>
          <p className="mono-stat">{about.stat}</p>
          <p className="lede">{about.lede}</p>

          {about.sections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}

          <p>
            <Button to="/quiz">{about.beginQuiz}</Button>
          </p>
        </div>
      </article>
    </>
  )
}
