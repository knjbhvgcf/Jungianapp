import guides from '../content/guides.json'
import pages from '../content/pages.json'
import type { Guide } from '../content/guideTypes'
import { FUNCTION_LIST } from '../data/functions'
import { Button } from '../components/Button'
import { Link } from 'react-router-dom'
import { FunctionCard } from '../components/FunctionCard'
import { Sparkle } from '../components/Icons'
import { Seo } from '../components/Seo'
import { Sketch } from '../components/Sketch'
import type { PagesContent } from '../content/schema'

const { home } = pages as PagesContent

export function Home() {
  return (
    <>
      <Seo title={home.seoTitle} description={home.seoDescription} path="/" />

      <section className="hero">
        <div className="wrap screen">
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <Sparkle className="sparkle sparkle--3" />
            <Sparkle className="sparkle sparkle--4" />
            {home.image ? (
              <img src={home.image} alt="" className="sketch type-portrait" />
            ) : (
              <Sketch kind="seeker" />
            )}
          </div>
          <h1 className="serif-title">{home.title}</h1>
          <p className="mono-stat">{home.stat}</p>
          <p className="lede">{home.lede}</p>
          <div className="hero__actions">
            <Button to="/quiz">{home.beginQuiz}</Button>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="wrap">
          <h2 id="how-heading">{home.howHeading}</h2>
          <ol className="steps">
            {home.steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="functions-heading">
        <div className="wrap">
          <h2 id="functions-heading">{home.functionsHeading}</h2>
          <p className="section__intro">{home.functionsIntro}</p>
          <div className="function-grid">
            {FUNCTION_LIST.map((fn) => (
              <div key={fn.id} id={`function-${fn.id}`}>
                <FunctionCard fn={fn} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="guides-heading">
        <div className="wrap">
          <h2 id="guides-heading">Read before you rate</h2>
          <p className="section__intro">
            These pages are written for search and for anyone who wants the distinctions before
            the forty-eight statements, and each one ends at the quiz.
          </p>
          <ul className="guide-index guide-index--home">
            {(guides as Guide[]).map((guide) => (
              <li key={guide.slug}>
                <Link to={`/${guide.slug}`}>
                  <strong>{guide.title}</strong>
                </Link>
                <p>{guide.seoDescription}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-heading">
        <div className="wrap narrow">
          <h2 id="faq-heading">{home.faqHeading}</h2>
          <div className="faq">
            {home.faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="cta-band">
            <h2>{home.ctaHeading}</h2>
            <Button to="/quiz">{home.beginQuiz}</Button>
          </div>
        </div>
      </section>
    </>
  )
}
