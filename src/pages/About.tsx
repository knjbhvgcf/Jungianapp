import { Button } from '../components/Button'
import { Editable, EditableButton, EditSeo } from '../components/Editable'
import { Seo } from '../components/Seo'
import { useEditMode, useSiteCopy } from '../lib/editMode'

export function About() {
  const { about } = useSiteCopy()
  const { editing, patchPages } = useEditMode()

  function patchAbout(partial: Partial<typeof about>) {
    patchPages((pages) => ({ ...pages, about: { ...pages.about, ...partial } }))
  }

  return (
    <>
      <Seo title={about.seoTitle} description={about.seoDescription} path="/about" />

      <article className="section">
        <div className="wrap prose">
          <EditSeo
            title={about.seoTitle}
            description={about.seoDescription}
            onTitle={(seoTitle) => patchAbout({ seoTitle })}
            onDescription={(seoDescription) => patchAbout({ seoDescription })}
          />
          <Editable
            as="p"
            className="eyebrow"
            label="Eyebrow"
            multiline={false}
            value={about.eyebrow}
            onChange={(eyebrow) => patchAbout({ eyebrow })}
          />
          <Editable
            as="h1"
            className="serif-title"
            label="Title"
            value={about.title}
            onChange={(title) => patchAbout({ title })}
          />
          <Editable
            as="p"
            className="mono-stat"
            label="Stat"
            multiline={false}
            value={about.stat}
            onChange={(stat) => patchAbout({ stat })}
          />
          <Editable
            as="p"
            className="lede"
            label="Lede"
            value={about.lede}
            onChange={(lede) => patchAbout({ lede })}
          />

          {about.sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <Editable
                as="h2"
                label={`Section ${sectionIndex + 1} heading`}
                value={section.heading}
                onChange={(heading) =>
                  patchAbout({
                    sections: about.sections.map((item, index) =>
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
                    patchAbout({
                      sections: about.sections.map((item, index) =>
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
            {editing ? (
              <EditableButton
                to="/quiz"
                label="Begin quiz"
                value={about.beginQuiz}
                onChange={(beginQuiz) => patchAbout({ beginQuiz })}
              />
            ) : (
              <Button to="/quiz">{about.beginQuiz}</Button>
            )}
          </p>
        </div>
      </article>
    </>
  )
}
