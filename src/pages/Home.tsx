import { Link } from 'react-router-dom'
import { FUNCTION_LIST } from '../data/functions'
import { Editable, EditableButton, EditSeo } from '../components/Editable'
import { FunctionCard } from '../components/FunctionCard'
import { Sparkle } from '../components/Icons'
import { Seo } from '../components/Seo'
import { HeroParty } from '../components/HeroParty'
import { useEditMode, useGuidesDraft, useSiteCopy } from '../lib/editMode'

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

export function Home() {
  const { home } = useSiteCopy()
  const { editing, patchPages, patchGuide } = useEditMode()
  const guides = useGuidesDraft()

  function patchHome(partial: Partial<typeof home>) {
    patchPages((pages) => ({ ...pages, home: { ...pages.home, ...partial } }))
  }

  return (
    <>
      <Seo title={home.seoTitle} description={home.seoDescription} path="/" />

      <section className="hero">
        <div className="hero-stage">
          <Sparkle className="sparkle sparkle--1" />
          <Sparkle className="sparkle sparkle--2" />
          <Sparkle className="sparkle sparkle--3" />
          <Sparkle className="sparkle sparkle--4" />
          <HeroParty />
        </div>
        <div className="wrap screen">
          <EditSeo
            title={home.seoTitle}
            description={home.seoDescription}
            onTitle={(seoTitle) => patchHome({ seoTitle })}
            onDescription={(seoDescription) => patchHome({ seoDescription })}
          />
          <Editable
            as="h1"
            className="serif-title"
            label="Title"
            value={home.title}
            onChange={(title) => patchHome({ title })}
          />
          <Editable
            as="p"
            className="mono-stat"
            label="Stat"
            multiline={false}
            value={home.stat}
            onChange={(stat) => patchHome({ stat })}
          />
          {editing ? (
            <Editable
              as="p"
              className="lede"
              label="Lede"
              value={home.lede}
              onChange={(lede) => patchHome({ lede })}
            />
          ) : (
            <p className="lede">{italicizeBookTitle(home.lede)}</p>
          )}
          <div className="hero__actions">
            <EditableButton
              to="/quiz"
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
                  onChange={(title) =>
                    patchHome({
                      steps: home.steps.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title } : item,
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

      <section className="section" aria-labelledby="guides-heading">
        <div className="wrap">
          <h2 id="guides-heading">Further reading</h2>
          <p className="section__intro">
            These pages explore the distinctions behind the forty-eight statements in greater depth,
            for those who want to look more closely at the ideas behind the quiz.
          </p>
          <ul className="guide-index guide-index--home">
            {guides.map((guide) =>
              editing ? (
                <li key={guide.slug}>
                  <Editable
                    as="h3"
                    label={`${guide.slug} title`}
                    value={guide.title}
                    onChange={(title) => patchGuide(guide.slug, (item) => ({ ...item, title }))}
                  />
                  <Editable
                    as="p"
                    label={`${guide.slug} summary`}
                    value={guide.seoDescription}
                    onChange={(seoDescription) =>
                      patchGuide(guide.slug, (item) => ({ ...item, seoDescription }))
                    }
                  />
                </li>
              ) : (
                <li key={guide.slug}>
                  <Link to={`/${guide.slug}`}>
                    <strong>{guide.title}</strong>
                  </Link>
                  <p>{guide.seoDescription}</p>
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
            {home.faq.map((item, index) =>
              editing ? (
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
              ) : (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ),
            )}
          </div>
          <div className="cta-band">
            <Editable
              as="h2"
              label="CTA heading"
              value={home.ctaHeading}
              onChange={(ctaHeading) => patchHome({ ctaHeading })}
            />
            <EditableButton
              to="/quiz"
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
