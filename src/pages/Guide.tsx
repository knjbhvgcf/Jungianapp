import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Editable, EditSeo } from '../components/Editable'
import { Seo } from '../components/Seo'
import { useEditMode, useGuidesDraft } from '../lib/editMode'
import { parseGuideBlock, parseGuideInline, type GuideDiagram } from '../lib/guideMarkup'
import { NotFound } from './NotFound'

function GuideInline({ text }: { text: string }) {
  const nodes: ReactNode[] = parseGuideInline(text).map((part, index) => {
    if (part.type === 'strong') return <strong key={index}>{part.value}</strong>
    if (part.type === 'em') return <em key={index}>{part.value}</em>
    return <span key={index}>{part.value}</span>
  })
  return <>{nodes}</>
}

function GuideCell({ cell }: { cell: GuideDiagram['columns'][number][number] }) {
  return (
    <>
      <strong className="guide-figure__code">{cell.code}</strong>
      {cell.note ? <span className="guide-figure__note">{cell.note}</span> : null}
    </>
  )
}

function Rhythm({ code }: { code: string }) {
  return (
    <p className="guide-figure__rhythm" aria-label={code}>
      {code.split('').map((letter, index) => (
        <span key={`${letter}-${index}`}>{letter}</span>
      ))}
    </p>
  )
}

function GuideFigure({ diagram }: { diagram: GuideDiagram }) {
  const className = `guide-figure guide-figure--${diagram.kind}`
  const caption = diagram.caption
  const cells = diagram.columns.flat()

  if (diagram.kind === 'pairs') {
    const labels = caption.split('|').map((item) => item.trim()).filter(Boolean)
    const groups = diagram.columns.length > 1 ? diagram.columns : [cells]
    return (
      <figure className={className}>
        {groups.map((group, index) => (
          <div key={labels[index] ?? index}>
            {labels[index] ? <p className="guide-figure__label">{labels[index]}</p> : null}
            <ul>
              {group.map((cell, cellIndex) => (
                <li key={`${cell.code}-${cellIndex}`}>
                  <strong>{cell.code}</strong>
                  <span className="guide-figure__rail" aria-hidden="true" />
                  <strong>{cell.note || cell.code}</strong>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </figure>
    )
  }

  if (diagram.kind === 'split') {
    const labels = caption.split('|').map((item) => item.trim()).filter(Boolean)
    return (
      <figure className={className}>
        <div className="guide-figure__split">
          {diagram.columns.map((column, index) => (
            <div key={labels[index] ?? index}>
              {labels[index] ? <p className="guide-figure__label">{labels[index]}</p> : null}
              <ul>
                {column.map((cell) => (
                  <li key={cell.code}>
                    <GuideCell cell={cell} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </figure>
    )
  }

  if (diagram.kind === 'stack') {
    return (
      <figure className={className}>
        {caption ? <figcaption>{caption}</figcaption> : null}
        <ol>
          {cells.map((cell, index) => (
            <li key={`${cell.code}-${index}`}>
              <GuideCell cell={cell} />
            </li>
          ))}
        </ol>
      </figure>
    )
  }

  if (diagram.kind === 'roles') {
    return (
      <figure className={className}>
        {caption ? <figcaption>{caption}</figcaption> : null}
        <ol>
          {cells.map((cell, index) => (
            <li key={`${cell.code}-${index}`}>
              <GuideCell cell={cell} />
            </li>
          ))}
        </ol>
      </figure>
    )
  }

  if (diagram.kind === 'stacks') {
    return (
      <figure className={className}>
        {cells.map((cell) => {
          const rungs = cell.note.split(/\s+/).filter(Boolean)
          return (
            <div key={cell.code}>
              <p className="guide-figure__label">{cell.code}</p>
              <ol>
                {rungs.map((rung) => (
                  <li key={rung}>{rung}</li>
                ))}
              </ol>
            </div>
          )
        })}
      </figure>
    )
  }

  if (diagram.kind === 'rules') {
    return (
      <figure className={className}>
        {caption ? <figcaption>{caption}</figcaption> : null}
        {cells.map((cell) => (
          <Rhythm key={cell.code} code={cell.code} />
        ))}
      </figure>
    )
  }

  if (diagram.kind === 'names') {
    return (
      <figure className={className}>
        <ul>
          {cells.map((cell) => {
            const inward = /i$/i.test(cell.code)
            return (
              <li key={cell.code}>
                <strong>{cell.code}</strong>
                <span className="guide-figure__turn" aria-hidden="true">
                  {inward ? '←' : '→'}
                </span>
                <span className="guide-figure__note">{cell.note}</span>
              </li>
            )
          })}
        </ul>
      </figure>
    )
  }

  return (
    <figure className={className}>
      {caption ? <figcaption>{caption}</figcaption> : null}
      <ul>
        {cells.map((cell, index) => (
          <li key={`${cell.code}-${index}`}>
            <GuideCell cell={cell} />
          </li>
        ))}
      </ul>
    </figure>
  )
}

function GuideBlockView({ text }: { text: string }) {
  const block = parseGuideBlock(text)
  if (block.type === 'diagram') return <GuideFigure diagram={block} />
  return (
    <p>
      <GuideInline text={block.text} />
    </p>
  )
}

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
        title={`${guide.seoTitle} | Jung Functions Quiz`}
        description={guide.seoDescription}
        path={`/${guide.slug}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.seoDescription,
          author: { '@type': 'Organization', name: 'Jungology' },
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
          {editing ? (
            <Editable
              as="p"
              className="lede"
              label="Lede"
              value={guide.lede}
              onChange={(lede) => patch({ lede })}
            />
          ) : (
            guide.lede.split(/\n\n+/).map((paragraph) => (
              <p key={paragraph} className="lede">
                <GuideInline text={paragraph} />
              </p>
            ))
          )}
          {guide.sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {editing || section.heading ? (
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
              ) : null}
              {section.paragraphs.map((paragraph, paragraphIndex) =>
                editing ? (
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
                ) : (
                  <GuideBlockView key={paragraphIndex} text={paragraph} />
                ),
              )}
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
        title="Jungian function guides | Jung Functions Quiz"
        description="Jungian type theory, the four-letter code, the function stack, Jung’s eight function-attitudes, how this quiz differs from MBTI, and type comparisons such as INFP vs INFJ."
        path="/guides"
      />
      <article className="section">
        <div className="wrap prose">
          <p className="eyebrow">guides</p>
          <h1 className="serif-title">Guides</h1>
          <p className="lede">
            Type theory, the four-letter code, the function stack, and short readings of Jung’s
            function-attitudes, written so you can take the quiz with a clearer sense of what is
            being measured.
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
