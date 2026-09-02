import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Editable, EditSeo } from '../components/Editable'
import { Seo } from '../components/Seo'
import { useEditMode, useGuidesDraft } from '../lib/editMode'
import { NotFound } from './NotFound'

function useGuide(slug: string) {
  return useGuidesDraft().find((guide) => guide.slug === slug)
}

export function GuidePage() {
  const { pathname } = useLocation()
  const slug = pathname.replace(/^\//, '')
  const guide = useGuide(slug)
  const { editing, patchGuide } = useEditMode()
  const all = useGuidesDraft()
  if (!guide) return <NotFound />

  const related = guide.related
    .map((item) => all.find((entry) => entry.slug === item))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const slugId = guide.slug

  function patch(partial: Partial<typeof guide>) {
    patchGuide(slugId, (current) => ({ ...current, ...partial }))
  }

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
          <EditSeo
            title={guide.seoTitle}
            description={guide.seoDescription}
            onTitle={(seoTitle) => patch({ seoTitle })}
            onDescription={(seoDescription) => patch({ seoDescription })}
          />
          <Editable
            as="p"
            className="eyebrow"
            label="Eyebrow"
            multiline={false}
            value={guide.eyebrow}
            onChange={(eyebrow) => patch({ eyebrow })}
          />
          <Editable
            as="h1"
            className="serif-title"
            label="Title"
            value={guide.title}
            onChange={(title) => patch({ title })}
          />
          <Editable
            as="p"
            className="mono-stat"
            label="Stat"
            multiline={false}
            value={guide.stat}
            onChange={(stat) => patch({ stat })}
          />
          <Editable
            as="p"
            className="lede"
            label="Lede"
            value={guide.lede}
            onChange={(lede) => patch({ lede })}
          />
          {guide.sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <Editable
                as="h2"
                label={`Section ${sectionIndex + 1} heading`}
                value={section.heading}
                onChange={(heading) =>
                  patch({
                    sections: guide.sections.map((item, index) =>
                      index === sectionIndex ? { ...item, heading } : item,
                    ),
                  })
                }
              />
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <Editable
                  key={paragraphIndex}
                  as="p"
                  label={`Section ${sectionIndex + 1} paragraph ${paragraphIndex + 1}`}
                  value={paragraph}
                  onChange={(next) =>
                    patch({
                      sections: guide.sections.map((item, index) =>
                        index === sectionIndex
                          ? {
                              ...item,
                              paragraphs: item.paragraphs.map((entry, entryIndex) =>
                                entryIndex === paragraphIndex ? next : entry,
                              ),
                            }
                          : item,
                      ),
                    })
                  }
                />
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
                    {editing ? (
                      <Editable
                        as="span"
                        label={`${item.slug} title`}
                        value={item.title}
                        onChange={(title) =>
                          patchGuide(item.slug, (current) => ({ ...current, title }))
                        }
                      />
                    ) : (
                      <Link to={`/${item.slug}`}>{item.title}</Link>
                    )}
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
  const guides = useGuidesDraft()
  const { editing, patchGuide } = useEditMode()
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
          <p>
            <Button to="/quiz">Begin the quiz</Button>
          </p>
        </div>
      </article>
    </>
  )
}
