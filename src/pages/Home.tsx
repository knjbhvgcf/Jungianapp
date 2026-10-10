import { Link } from 'react-router-dom'
import { FUNCTION_LIST } from '../data/functions'
import { Editable, EditableButton, EditSeo } from '../components/Editable'
import { FunctionCard } from '../components/FunctionCard'
import { Sparkle } from '../components/Icons'
import { Seo } from '../components/Seo'
import { HeroParty } from '../components/HeroParty'
import { useEditMode, useGuidesDraft, useSiteCopy } from '../lib/editMode'
import { parseGuideBlock, parseGuideInline } from '../lib/guideMarkup'
import { QUIZ_PATH, TEST_LANDING_PATH, TEST_LANDING_SLUG } from '../lib/quizPath'
import type { ReactNode } from 'react'

function italicizeBookTitle(text: string) {
  const title = 'Psychological Types'
  const index = text.indexOf(title)
  if (index === -1) return text
  return (
    <>
      {text.slice(0, index)}
      <cite>{title}</cite>
      {text.slice(index + title.length)}
    </>
  )
}

function GuideInline({ text }: { text: string }) {
  const nodes: ReactNode[] = parseGuideInline(text).map((part, index) => {
    if (part.type === 'strong') return <strong key={index}>{part.value}</strong>
    if (part.type === 'em') return <em key={index}>{part.value}</em>
    return <span key={index}>{part.value}</span>
  })
  return <>{nodes}</>
}

const LANDING_FAQ = {
  q: 'What is a Jungian cognitive functions test?',
  a: 'You rate fifty-two statements; the site scores Jung’s eight function-attitudes in your browser, then suggests a likely type. There is no account, and the letters, if they appear, are a name for the stack — not the thing that was measured.',
}

export function Home() {
  return <HomeView />
}

export function TestLanding() {
  return <HomeView landing />
}

function HomeView({ landing = false }: { landing?: boolean }) {
  const { home } = useSiteCopy()
  const { editing, patchPages, patchGuide } = useEditMode()
  const guides = useGuidesDraft()
  const guide = guides.find((item) => item.slug === TEST_LANDING_SLUG)
  const listedGuides = landing ? guides.filter((item) => item.slug !== TEST_LANDING_SLUG) : guides
  const lede = landing ? (guide?.lede ?? home.lede) : home.lede
  const seoTitle = landing
    ? `${guide?.seoTitle ?? 'Jungian Cognitive Functions Test'} | Jung Functions Quiz`
    : home.seoTitle
  const seoDescription = landing ? (guide?.seoDescription ?? home.seoDescription) : home.seoDescription
  const path = landing ? TEST_LANDING_PATH : '/'
  const faq = landing
    ? [LANDING_FAQ, ...home.faq.filter((item) => item.q !== 'What is Jungology?')]
    : home.faq

  function patchHome(partial: Partial<typeof home>) {
    patchPages((pages) => ({ ...pages, home: { ...pages.home, ...partial } }))
  }

  function patchLanding(partial: {
    seoTitle?: string
    seoDescription?: string
    title?: string
    stat?: string
    lede?: string
  }) {
    patchGuide(TEST_LANDING_SLUG, (current) => ({ ...current, ...partial }))
  }

  return (
    <>
      <Seo title={seoTitle} description={seoDescription} path={path} />

      <section className="hero">
        <div className="hero-stage">
          <Sparkle className="sparkle sparkle--1" />
          <Sparkle className="sparkle sparkle--2" />
          <Sparkle className="sparkle sparkle--3" />
          <Sparkle className="sparkle sparkle--4" />
          <HeroParty />
        </div>
        <div className="wrap screen">
          {landing && guide ? (
            <EditSeo
              title={guide.seoTitle}
              description={guide.seoDescription}
              onTitle={(seoTitleValue) => patchLanding({ seoTitle: seoTitleValue })}
              onDescription={(seoDescriptionValue) => patchLanding({ seoDescription: seoDescriptionValue })}
            />
          ) : (
            <EditSeo
              title={home.seoTitle}
              description={home.seoDescription}
              onTitle={(next) => patchHome({ seoTitle: next })}
              onDescription={(next) => patchHome({ seoDescription: next })}
            />
          )}
          {landing && guide ? (
            <Editable
              as="h1"
              className="serif-title"
              label="Title"
              value={guide.title}
              onChange={(next) => patchLanding({ title: next })}
            />
          ) : (
            <Editable
              as="h1"
              className="serif-title"
              label="Title"
              value={home.title}
              onChange={(next) => patchHome({ title: next })}
            />
          )}
          {landing && guide ? (
            <Editable
              as="p"
              className="mono-stat"
              label="Stat"
              multiline={false}
              value={guide.stat}
              onChange={(next) => patchLanding({ stat: next })}
            />
          ) : (
            <Editable
              as="p"
              className="mono-stat"
              label="Stat"
              multiline={false}
              value={home.stat}
              onChange={(statValue) => patchHome({ stat: statValue })}
            />
          )}
          {editing && landing && guide ? (
            <Editable as="p" className="lede" label="Lede" value={guide.lede} onChange={(next) => patchLanding({ lede: next })} />
          ) : editing ? (
            <Editable as="p" className="lede" label="Lede" value={home.lede} onChange={(next) => patchHome({ lede: next })} />
          ) : (
            lede.split(/\n\n+/).map((paragraph) => (
              <p key={paragraph} className="lede">
                {landing ? <GuideInline text={paragraph} /> : italicizeBookTitle(paragraph)}
              </p>
            ))
          )}
          <div className="hero__actions">
            <EditableButton
              to={QUIZ_PATH}
              label="Begin quiz"
              value={home.beginQuiz}
              onChange={(beginQuiz) => patchHome({ beginQuiz })}
            />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="wrap">
          <Editable
            as="h2"
            label="How heading"
            value={home.howHeading}
            onChange={(howHeading) => patchHome({ howHeading })}
          />
          <ol className="steps">
            {home.steps.map((step, index) => (
              <li key={index}>
                <Editable
                  as="h3"
                  label={`Step ${index + 1} title`}
                  value={step.title}
                  onChange={(stepTitle) =>
                    patchHome({
                      steps: home.steps.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: stepTitle } : item,
                      ),
                    })
                  }
                />
                <Editable
                  as="p"
                  label={`Step ${index + 1} body`}
                  value={step.body}
                  onChange={(body) =>
                    patchHome({
                      steps: home.steps.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, body } : item,
                      ),
                    })
                  }
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="functions-heading">
        <div className="wrap">
          <Editable
            as="h2"
            label="Functions heading"
            value={home.functionsHeading}
            onChange={(functionsHeading) => patchHome({ functionsHeading })}
          />
          <Editable
            as="p"
            className="section__intro"
            label="Functions intro"
            value={home.functionsIntro}
            onChange={(functionsIntro) => patchHome({ functionsIntro })}
          />
          <div className="function-grid">
            {FUNCTION_LIST.map((fn) => (
              <div key={fn.id} id={`function-${fn.id}`}>
                <FunctionCard fn={fn} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {landing && guide ? (
        <section className="section">
          <div className="wrap prose">
            {guide.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {section.heading ? <h2>{section.heading}</h2> : null}
                {section.paragraphs.map((paragraph, paragraphIndex) =>
                  parseGuideBlock(paragraph).type === 'diagram' ? null : (
                    <p key={paragraphIndex}>
                      <GuideInline text={paragraph} />
                    </p>
                  ),
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="guides-heading">
        <div className="wrap">
          <h2 id="guides-heading">Further reading</h2>
          <p className="section__intro">
            These pages start with type theory, the four-letter code, and the function stack, then
            the distinctions behind the fifty-two statements, for those who want to look more
            closely at the ideas behind the quiz.
          </p>
          <ul className="guide-index guide-index--home">
            {listedGuides.map((item) =>
              editing ? (
                <li key={item.slug}>
                  <Editable
                    as="h3"
                    label={`${item.slug} title`}
                    value={item.title}
                    onChange={(next) => patchGuide(item.slug, (entry) => ({ ...entry, title: next }))}
                  />
                  <Editable
                    as="p"
                    label={`${item.slug} summary`}
                    value={item.seoDescription}
                    onChange={(seoDescription) =>
                      patchGuide(item.slug, (entry) => ({ ...entry, seoDescription }))
                    }
                  />
                </li>
              ) : (
                <li key={item.slug}>
                  <Link to={`/${item.slug}`}>
                    <strong>{item.title}</strong>
                  </Link>
                  <p>{item.seoDescription}</p>
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-heading">
        <div className="wrap narrow">
          <Editable
            as="h2"
            label="FAQ heading"
            value={home.faqHeading}
            onChange={(faqHeading) => patchHome({ faqHeading })}
          />
          <div className="faq">
            {editing && !landing
              ? home.faq.map((item, index) => (
                  <div key={index} className="faq-edit">
                    <Editable
                      as="h3"
                      label={`Question ${index + 1}`}
                      value={item.q}
                      onChange={(q) =>
                        patchHome({
                          faq: home.faq.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, q } : entry,
                          ),
                        })
                      }
                    />
                    <Editable
                      as="p"
                      label={`Answer ${index + 1}`}
                      value={item.a}
                      onChange={(a) =>
                        patchHome({
                          faq: home.faq.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, a } : entry,
                          ),
                        })
                      }
                    />
                  </div>
                ))
              : faq.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
          </div>
          <div className="cta-band">
            <Editable
              as="h2"
              label="CTA heading"
              value={home.ctaHeading}
              onChange={(ctaHeading) => patchHome({ ctaHeading })}
            />
            <EditableButton
              to={QUIZ_PATH}
              label="Begin quiz"
              value={home.beginQuiz}
              onChange={(beginQuiz) => patchHome({ beginQuiz })}
            />
          </div>
        </div>
      </section>
    </>
  )
}
