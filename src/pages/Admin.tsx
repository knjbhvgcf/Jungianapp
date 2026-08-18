import { useEffect, useMemo, useState, type ReactNode } from 'react'
import followupSeed from '../content/followup.json'
import pagesSeed from '../content/pages.json'
import questionsSeed from '../content/questions.json'
import guidesSeed from '../content/guides.json'
import typesSeed from '../content/types.json'
import type { Guide } from '../content/guideTypes'
import type {
  CompatPageCopy,
  FollowupContent,
  MapPageCopy,
  PagesContent,
  QuestionsContent,
  TypeContent,
  UnlockCopy,
} from '../content/schema'
import { emptyGuide, isValidSlug } from '../lib/guides'
import { FUNCTION_IDS, FUNCTIONS, type FunctionId } from '../data/functions'
import type { QuestionFacet } from '../data/questions'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import {
  clearCmsPassword,
  downloadJson,
  fetchCmsStatus,
  getCmsPassword,
  saveCmsFile,
  setCmsPassword,
  uploadCmsImage,
  type CmsStatus,
} from '../lib/cms'

type Tab = 'home' | 'about' | 'results' | 'paywall' | 'types' | 'guides' | 'quiz' | 'followup'

const FACETS: QuestionFacet[] = ['orientation', 'criterion', 'process', 'reverse']

function clone<T>(value: T): T {
  return structuredClone(value)
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function Admin() {
  const [status, setStatus] = useState<CmsStatus | null>(null)
  const [password, setPassword] = useState(getCmsPassword)
  const [unlocked, setUnlocked] = useState(Boolean(getCmsPassword()))
  const [tab, setTab] = useState<Tab>('home')
  const [pages, setPages] = useState<PagesContent>(() => clone(pagesSeed as PagesContent))
  const [questions, setQuestions] = useState<QuestionsContent>(
    () => clone(questionsSeed as QuestionsContent),
  )
  const [followup, setFollowup] = useState<FollowupContent>(
    () => clone(followupSeed as FollowupContent),
  )
  const [types, setTypes] = useState<TypeContent[]>(() => clone(typesSeed as unknown as TypeContent[]))
  const [guides, setGuides] = useState<Guide[]>(() => clone(guidesSeed as Guide[]))
  const [guideSlug, setGuideSlug] = useState(() => (guidesSeed as Guide[])[0]?.slug ?? 'new-article')
  const [typeCode, setTypeCode] = useState('INTJ')
  const [functionId, setFunctionId] = useState<FunctionId>('Ni')
  const [pairKey, setPairKey] = useState('Ni-Ne')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetchCmsStatus().then(setStatus)
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
  }, [])

  const pairKeys = useMemo(() => {
    return [...Object.keys(followup.attitude), ...Object.keys(followup.rival)]
  }, [followup])

  const pairBank = followup.attitude[pairKey] ? 'attitude' : 'rival'
  const [left = 'A', right = 'B'] = pairKey.split('-')

  async function saveCurrent() {
    setBusy(true)
    setMessage('')
    try {
      if (tab === 'home' || tab === 'about' || tab === 'results' || tab === 'paywall') {
        await saveCmsFile('pages', pages, password)
      } else if (tab === 'quiz') {
        const next = clone(questions)
        for (const id of FUNCTION_IDS) {
          next[id] = next[id].map((item) => ({
            ...item,
            functionId: id,
            reverse: item.facet === 'reverse' ? true : undefined,
          }))
        }
        await saveCmsFile('questions', next, password)
        setQuestions(next)
      } else if (tab === 'types') {
        await saveCmsFile('types', types, password)
      } else if (tab === 'guides') {
        const invalid = guides.find((guide) => !isValidSlug(guide.slug))
        if (invalid) {
          throw new Error(
            `Use a simple URL slug such as ni-vs-ne. “${invalid.slug}” is reserved or not valid.`,
          )
        }
        const slugs = guides.map((guide) => guide.slug)
        if (new Set(slugs).size !== slugs.length) {
          throw new Error('Each article needs its own slug.')
        }
        await saveCmsFile('guides', guides, password)
      } else {
        await saveCmsFile('followup', followup, password)
      }
      setMessage('Saved. The site will pick this up on the next refresh.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  function downloadCurrent() {
    if (tab === 'home' || tab === 'about' || tab === 'results' || tab === 'paywall') {
      downloadJson('pages.json', pages)
    } else if (tab === 'quiz') downloadJson('questions.json', questions)
    else if (tab === 'types') downloadJson('types.json', types)
    else if (tab === 'guides') downloadJson('guides.json', guides)
    else downloadJson('followup.json', followup)
  }

  if (!unlocked) {
    return (
      <article className="section">
        <Seo
          title="CMS | Jung Functions"
          description="Edit page copy and quiz questions."
          path="/admin"
        />
        <div className="wrap narrow cms">
          <p className="eyebrow">local editor</p>
          <h1 className="serif-title">CMS</h1>
          <p className="lede">
            This page edits Home, About, Results, the sixteen type portraits and essays, SEO
            guides, the map and compatibility paywalls, the forty-eight quiz statements, and the
            follow-up questions, and it writes those files on this computer while the site is
            running in development.
          </p>
          {status?.usingDefault ? (
            <p className="cms-note">
              No <code>ADMIN_PASSWORD</code> is set in <code>.env</code>, so the password is{' '}
              <code>jung</code> until you change it.
            </p>
          ) : null}
          <form
            className="cms-login"
            onSubmit={(event) => {
              event.preventDefault()
              setCmsPassword(password)
              setUnlocked(true)
            }}
          >
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Button type="submit">Open the editor</Button>
          </form>
        </div>
      </article>
    )
  }

  return (
    <article className="section">
      <Seo
        title="CMS | Jung Functions"
        description="Edit page copy and quiz questions."
        path="/admin"
      />
      <div className="wrap cms">
        <p className="eyebrow">local editor</p>
        <h1 className="serif-title">CMS</h1>
        <p className="lede">
          Change the wording here, then save. Saving only writes files while you are running{' '}
          <code>npm run dev</code>; after that, deploy the site so the live pages match.
        </p>
        {!status?.writable ? (
          <p className="cms-note">
            This build cannot write files. Download the JSON and replace the matching file in{' '}
            <code>src/content</code>, or open this page while the site is running locally.
          </p>
        ) : null}

        <div className="cms-tabs" role="tablist" aria-label="Content to edit">
          {(
            [
              ['home', 'Home'],
              ['about', 'About'],
              ['results', 'Results'],
              ['types', 'Types'],
              ['guides', 'Guides'],
              ['paywall', 'Paywall'],
              ['quiz', 'Quiz questions'],
              ['followup', 'Follow-up'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'is-active' : undefined}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'home' ? (
          <HomeEditor
            pages={pages}
            setPages={setPages}
            password={password}
            writable={Boolean(status?.writable)}
            onMessage={setMessage}
          />
        ) : null}
        {tab === 'about' ? <AboutEditor pages={pages} setPages={setPages} /> : null}
        {tab === 'results' ? <ResultsEditor pages={pages} setPages={setPages} /> : null}
        {tab === 'types' ? (
          <TypesEditor
            types={types}
            setTypes={setTypes}
            typeCode={typeCode}
            setTypeCode={setTypeCode}
            password={password}
            writable={Boolean(status?.writable)}
            onMessage={setMessage}
          />
        ) : null}
        {tab === 'guides' ? (
          <GuidesEditor
            guides={guides}
            setGuides={setGuides}
            guideSlug={guideSlug}
            setGuideSlug={setGuideSlug}
          />
        ) : null}
        {tab === 'paywall' ? <PaywallEditor pages={pages} setPages={setPages} /> : null}
        {tab === 'quiz' ? (
          <QuizEditor
            questions={questions}
            setQuestions={setQuestions}
            functionId={functionId}
            setFunctionId={setFunctionId}
          />
        ) : null}
        {tab === 'followup' ? (
          <FollowupEditor
            followup={followup}
            setFollowup={setFollowup}
            pairKey={pairKey}
            setPairKey={setPairKey}
            pairKeys={pairKeys}
            pairBank={pairBank}
            left={left}
            right={right}
          />
        ) : null}

        <div className="cms-toolbar">
          <Button type="button" disabled={busy || !status?.writable} onClick={() => void saveCurrent()}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={downloadCurrent}>
            Download JSON
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clearCmsPassword()
              setUnlocked(false)
            }}
          >
            Lock
          </Button>
        </div>
        {message ? <p className="cms-status">{message}</p> : null}
      </div>
    </article>
  )
}

function HomeEditor({
  pages,
  setPages,
  password,
  writable,
  onMessage,
}: {
  pages: PagesContent
  setPages: (pages: PagesContent) => void
  password: string
  writable: boolean
  onMessage: (message: string) => void
}) {
  const home = pages.home
  function patch(partial: Partial<PagesContent['home']>) {
    setPages({ ...pages, home: { ...home, ...partial } })
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    onMessage('')
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read that file'))
        reader.readAsDataURL(file)
      })
      const image = await uploadCmsImage('HOME', dataUrl, password)
      patch({ image })
      onMessage('Image saved. Click Save to keep it on the homepage.')
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  return (
    <div className="cms-panel">
      <fieldset className="cms-card">
        <legend>Hero image</legend>
        <div className="cms-image-preview">
          {home.image ? (
            <img src={home.image} alt="" />
          ) : (
            <p className="cms-note">Using the default sketch until you add a picture.</p>
          )}
        </div>
        <TextField
          label="Image URL or path"
          value={home.image}
          onChange={(value) => patch({ image: value })}
          hint="Upload below, or paste a path such as /home/hero.png"
        />
        <Field label="Upload a picture">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            disabled={!writable}
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </Field>
        {home.image ? (
          <button type="button" className="cms-text-btn" onClick={() => patch({ image: '' })}>
            Use the default sketch again
          </button>
        ) : null}
      </fieldset>
      <Field label="Page title (browser tab)">
        <input value={home.seoTitle} onChange={(event) => patch({ seoTitle: event.target.value })} />
      </Field>
      <Field label="Search description">
        <textarea
          rows={3}
          value={home.seoDescription}
          onChange={(event) => patch({ seoDescription: event.target.value })}
        />
      </Field>
      <Field label="Hero title">
        <input value={home.title} onChange={(event) => patch({ title: event.target.value })} />
      </Field>
      <Field label="Hero stat line">
        <input value={home.stat} onChange={(event) => patch({ stat: event.target.value })} />
      </Field>
      <Field label="Hero lede">
        <textarea rows={5} value={home.lede} onChange={(event) => patch({ lede: event.target.value })} />
      </Field>
      <Field label="Begin-quiz button">
        <input value={home.beginQuiz} onChange={(event) => patch({ beginQuiz: event.target.value })} />
      </Field>
      <Field label="How-it-works heading">
        <input value={home.howHeading} onChange={(event) => patch({ howHeading: event.target.value })} />
      </Field>
      {home.steps.map((step, index) => (
        <fieldset key={index} className="cms-card">
          <legend>Step {index + 1}</legend>
          <Field label="Title">
            <input
              value={step.title}
              onChange={(event) => {
                const steps = home.steps.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, title: event.target.value } : item,
                )
                patch({ steps })
              }}
            />
          </Field>
          <Field label="Body">
            <textarea
              rows={4}
              value={step.body}
              onChange={(event) => {
                const steps = home.steps.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, body: event.target.value } : item,
                )
                patch({ steps })
              }}
            />
          </Field>
        </fieldset>
      ))}
      <Field label="Functions heading">
        <input
          value={home.functionsHeading}
          onChange={(event) => patch({ functionsHeading: event.target.value })}
        />
      </Field>
      <Field label="Functions introduction">
        <textarea
          rows={4}
          value={home.functionsIntro}
          onChange={(event) => patch({ functionsIntro: event.target.value })}
        />
      </Field>
      <Field label="FAQ heading">
        <input value={home.faqHeading} onChange={(event) => patch({ faqHeading: event.target.value })} />
      </Field>
      {home.faq.map((item, index) => (
        <fieldset key={index} className="cms-card">
          <legend>FAQ {index + 1}</legend>
          <Field label="Question">
            <input
              value={item.q}
              onChange={(event) => {
                const faq = home.faq.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, q: event.target.value } : entry,
                )
                patch({ faq })
              }}
            />
          </Field>
          <Field label="Answer">
            <textarea
              rows={4}
              value={item.a}
              onChange={(event) => {
                const faq = home.faq.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, a: event.target.value } : entry,
                )
                patch({ faq })
              }}
            />
          </Field>
          <button
            type="button"
            className="cms-text-btn"
            onClick={() => patch({ faq: home.faq.filter((_, entryIndex) => entryIndex !== index) })}
          >
            Remove this question
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="cms-text-btn"
        onClick={() => patch({ faq: [...home.faq, { q: '', a: '' }] })}
      >
        Add a FAQ
      </button>
      <Field label="Closing heading">
        <input value={home.ctaHeading} onChange={(event) => patch({ ctaHeading: event.target.value })} />
      </Field>
    </div>
  )
}

function AboutEditor({
  pages,
  setPages,
}: {
  pages: PagesContent
  setPages: (pages: PagesContent) => void
}) {
  const about = pages.about
  function patch(partial: Partial<PagesContent['about']>) {
    setPages({ ...pages, about: { ...about, ...partial } })
  }

  return (
    <div className="cms-panel">
      <Field label="Page title (browser tab)">
        <input value={about.seoTitle} onChange={(event) => patch({ seoTitle: event.target.value })} />
      </Field>
      <Field label="Search description">
        <textarea
          rows={3}
          value={about.seoDescription}
          onChange={(event) => patch({ seoDescription: event.target.value })}
        />
      </Field>
      <Field label="Eyebrow">
        <input value={about.eyebrow} onChange={(event) => patch({ eyebrow: event.target.value })} />
      </Field>
      <Field label="Title">
        <input value={about.title} onChange={(event) => patch({ title: event.target.value })} />
      </Field>
      <Field label="Stat line">
        <input value={about.stat} onChange={(event) => patch({ stat: event.target.value })} />
      </Field>
      <Field label="Lede">
        <textarea
          rows={5}
          value={about.lede}
          onChange={(event) => patch({ lede: event.target.value })}
        />
      </Field>
      {about.sections.map((section, index) => (
        <fieldset key={index} className="cms-card">
          <legend>Section {index + 1}</legend>
          <Field label="Heading">
            <input
              value={section.heading}
              onChange={(event) => {
                const sections = about.sections.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, heading: event.target.value } : item,
                )
                patch({ sections })
              }}
            />
          </Field>
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <Field key={paragraphIndex} label={`Paragraph ${paragraphIndex + 1}`}>
              <textarea
                rows={5}
                value={paragraph}
                onChange={(event) => {
                  const sections = about.sections.map((item, itemIndex) => {
                    if (itemIndex !== index) return item
                    const paragraphs = item.paragraphs.map((entry, entryIndex) =>
                      entryIndex === paragraphIndex ? event.target.value : entry,
                    )
                    return { ...item, paragraphs }
                  })
                  patch({ sections })
                }}
              />
            </Field>
          ))}
          <button
            type="button"
            className="cms-text-btn"
            onClick={() => {
              const sections = about.sections.map((item, itemIndex) =>
                itemIndex === index ? { ...item, paragraphs: [...item.paragraphs, ''] } : item,
              )
              patch({ sections })
            }}
          >
            Add a paragraph
          </button>
          <button
            type="button"
            className="cms-text-btn"
            onClick={() =>
              patch({ sections: about.sections.filter((_, itemIndex) => itemIndex !== index) })
            }
          >
            Remove this section
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="cms-text-btn"
        onClick={() =>
          patch({ sections: [...about.sections, { heading: '', paragraphs: [''] }] })
        }
      >
        Add a section
      </button>
      <Field label="Begin-quiz button">
        <input
          value={about.beginQuiz}
          onChange={(event) => patch({ beginQuiz: event.target.value })}
        />
      </Field>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  rows,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      {rows ? (
        <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  )
}

function ResultsEditor({
  pages,
  setPages,
}: {
  pages: PagesContent
  setPages: (pages: PagesContent) => void
}) {
  const results = pages.results
  function patch(partial: Partial<PagesContent['results']>) {
    setPages({ ...pages, results: { ...results, ...partial } })
  }

  return (
    <div className="cms-panel">
      <p className="cms-note">
        Use <code>{'{price}'}</code> where the unlock price should appear,{' '}
        <code>{'{code}'}</code> and <code>{'{title}'}</code> for the type, and{' '}
        <code>{'{heroName}'}</code> for the leading function’s full name.
      </p>
      <fieldset className="cms-card">
        <legend>Empty state</legend>
        <TextField label="Browser title" value={results.seoTitleEmpty} onChange={(value) => patch({ seoTitleEmpty: value })} />
        <TextField label="Search description" rows={3} value={results.seoDescriptionEmpty} onChange={(value) => patch({ seoDescriptionEmpty: value })} />
        <TextField label="Title" value={results.emptyTitle} onChange={(value) => patch({ emptyTitle: value })} />
        <TextField label="Stat line" value={results.emptyStat} onChange={(value) => patch({ emptyStat: value })} />
        <TextField label="Body" rows={4} value={results.emptyBody} onChange={(value) => patch({ emptyBody: value })} />
        <TextField label="Begin-quiz button" value={results.beginQuiz} onChange={(value) => patch({ beginQuiz: value })} />
      </fieldset>
      <fieldset className="cms-card">
        <legend>Finished result</legend>
        <TextField label="Browser title" value={results.seoTitle} onChange={(value) => patch({ seoTitle: value })} />
        <TextField label="Search description" rows={3} value={results.seoDescription} onChange={(value) => patch({ seoDescription: value })} />
        <TextField label="Scores heading" value={results.scoresHeading} onChange={(value) => patch({ scoresHeading: value })} />
        <TextField label="Scores introduction" rows={4} value={results.scoresIntro} onChange={(value) => patch({ scoresIntro: value })} />
        <TextField label="Close-score note" rows={3} value={results.closeNote} onChange={(value) => patch({ closeNote: value })} />
        <TextField label="Also-close prefix" value={results.alsoClosePrefix} onChange={(value) => patch({ alsoClosePrefix: value })} />
      </fieldset>
      <fieldset className="cms-card">
        <legend>Buttons</legend>
        <TextField label="Arrange the stack" value={results.arrangeStack} onChange={(value) => patch({ arrangeStack: value })} />
        <TextField label="Open map" value={results.openMap} onChange={(value) => patch({ openMap: value })} />
        <TextField label="Unlock map (short)" value={results.unlockMap} onChange={(value) => patch({ unlockMap: value })} />
        <TextField label="Open compatibility" value={results.openCompat} onChange={(value) => patch({ openCompat: value })} />
        <TextField label="Compatibility (short)" value={results.compatShort} onChange={(value) => patch({ compatShort: value })} />
        <TextField label="Retake" value={results.retake} onChange={(value) => patch({ retake: value })} />
        <TextField label="Clear answers" value={results.clearAnswers} onChange={(value) => patch({ clearAnswers: value })} />
        <TextField label="Copy summary" value={results.copySummary} onChange={(value) => patch({ copySummary: value })} />
        <TextField label="Copied" value={results.copied} onChange={(value) => patch({ copied: value })} />
        <TextField label="Method link" value={results.methodLink} onChange={(value) => patch({ methodLink: value })} />
      </fieldset>
      <fieldset className="cms-card">
        <legend>Map upsell</legend>
        <TextField label="Eyebrow" value={results.mapEyebrow} onChange={(value) => patch({ mapEyebrow: value })} />
        <TextField label="Title (unlocked)" value={results.mapTitle} onChange={(value) => patch({ mapTitle: value })} />
        <TextField label="Title (locked)" value={results.mapTitleLocked} onChange={(value) => patch({ mapTitleLocked: value })} />
        <TextField label="Body (unlocked)" rows={4} value={results.mapBodyUnlocked} onChange={(value) => patch({ mapBodyUnlocked: value })} />
        <TextField label="Body (locked)" rows={4} value={results.mapBodyLocked} onChange={(value) => patch({ mapBodyLocked: value })} />
        <TextField label="Button (unlocked)" value={results.mapCtaUnlocked} onChange={(value) => patch({ mapCtaUnlocked: value })} />
        <TextField label="Button (locked)" value={results.mapCtaLocked} onChange={(value) => patch({ mapCtaLocked: value })} />
      </fieldset>
      <fieldset className="cms-card">
        <legend>Compatibility upsell</legend>
        <TextField label="Eyebrow" value={results.compatEyebrow} onChange={(value) => patch({ compatEyebrow: value })} />
        <TextField label="Title" value={results.compatTitle} onChange={(value) => patch({ compatTitle: value })} />
        <TextField label="Body (unlocked)" rows={4} value={results.compatBodyUnlocked} onChange={(value) => patch({ compatBodyUnlocked: value })} />
        <TextField label="Body (locked)" rows={4} value={results.compatBodyLocked} onChange={(value) => patch({ compatBodyLocked: value })} />
        <TextField label="Button (unlocked)" value={results.compatCtaUnlocked} onChange={(value) => patch({ compatCtaUnlocked: value })} />
        <TextField label="Button (locked)" value={results.compatCtaLocked} onChange={(value) => patch({ compatCtaLocked: value })} />
      </fieldset>
    </div>
  )
}

function PaywallEditor({
  pages,
  setPages,
}: {
  pages: PagesContent
  setPages: (pages: PagesContent) => void
}) {
  const [product, setProduct] = useState<'map' | 'compat'>('map')
  const paywall = pages.paywall

  function patchUnlock(partial: Partial<UnlockCopy>) {
    setPages({
      ...pages,
      paywall: { ...paywall, [product]: { ...paywall[product], ...partial } },
    })
  }

  function patchMapPage(partial: Partial<MapPageCopy>) {
    setPages({
      ...pages,
      paywall: { ...paywall, mapPage: { ...paywall.mapPage, ...partial } },
    })
  }

  function patchCompatPage(partial: Partial<CompatPageCopy>) {
    setPages({
      ...pages,
      paywall: { ...paywall, compatPage: { ...paywall.compatPage, ...partial } },
    })
  }

  const unlock = paywall[product]

  return (
    <div className="cms-panel">
      <p className="cms-note">
        This is the locked-page copy and the key form. Checkout URLs and prices still come from{' '}
        <code>.env</code> (<code>VITE_DOSSIER_*</code> and <code>VITE_COMPAT_*</code>).
      </p>
      <div className="cms-chips" role="tablist" aria-label="Add-on">
        <button type="button" className={product === 'map' ? 'is-active' : undefined} onClick={() => setProduct('map')}>
          Map
        </button>
        <button
          type="button"
          className={product === 'compat' ? 'is-active' : undefined}
          onClick={() => setProduct('compat')}
        >
          Compatibility
        </button>
      </div>
      <fieldset className="cms-card">
        <legend>Unlock panel</legend>
        <TextField label="Eyebrow" value={unlock.eyebrow} onChange={(value) => patchUnlock({ eyebrow: value })} />
        <TextField label="Title" value={unlock.title} onChange={(value) => patchUnlock({ title: value })} />
        <TextField label="Body" rows={5} value={unlock.body} onChange={(value) => patchUnlock({ body: value })} />
        {unlock.bullets.map((bullet, index) => (
          <TextField
            key={index}
            label={`Bullet ${index + 1}`}
            value={bullet}
            onChange={(value) => {
              const bullets = unlock.bullets.map((item, itemIndex) => (itemIndex === index ? value : item))
              patchUnlock({ bullets })
            }}
          />
        ))}
        <button
          type="button"
          className="cms-text-btn"
          onClick={() => patchUnlock({ bullets: [...unlock.bullets, ''] })}
        >
          Add a bullet
        </button>
        {unlock.bullets.length > 1 ? (
          <button
            type="button"
            className="cms-text-btn"
            onClick={() => patchUnlock({ bullets: unlock.bullets.slice(0, -1) })}
          >
            Remove last bullet
          </button>
        ) : null}
        <TextField label="Checkout button" value={unlock.cta} onChange={(value) => patchUnlock({ cta: value })} />
        <TextField label="Key label" value={unlock.keyLabel} onChange={(value) => patchUnlock({ keyLabel: value })} />
        <TextField
          label="Key placeholder"
          value={unlock.keyPlaceholder}
          onChange={(value) => patchUnlock({ keyPlaceholder: value })}
        />
        <TextField label="Unlock button" value={unlock.unlockButton} onChange={(value) => patchUnlock({ unlockButton: value })} />
        <TextField label="Wrong-key error" rows={3} value={unlock.error} onChange={(value) => patchUnlock({ error: value })} />
        <TextField
          label="Checkout missing"
          rows={3}
          value={unlock.checkoutMissing}
          onChange={(value) => patchUnlock({ checkoutMissing: value })}
        />
      </fieldset>
      {product === 'map' ? (
        <fieldset className="cms-card">
          <legend>Map page</legend>
          <TextField label="Empty browser title" value={paywall.mapPage.emptySeoTitle} onChange={(value) => patchMapPage({ emptySeoTitle: value })} />
          <TextField label="Empty search description" rows={3} value={paywall.mapPage.emptySeoDescription} onChange={(value) => patchMapPage({ emptySeoDescription: value })} />
          <TextField label="Empty title" value={paywall.mapPage.emptyTitle} onChange={(value) => patchMapPage({ emptyTitle: value })} />
          <TextField label="Empty stat" value={paywall.mapPage.emptyStat} onChange={(value) => patchMapPage({ emptyStat: value })} />
          <TextField label="Empty body" rows={3} value={paywall.mapPage.emptyBody} onChange={(value) => patchMapPage({ emptyBody: value })} />
          <TextField label="Begin-quiz button" value={paywall.mapPage.beginQuiz} onChange={(value) => patchMapPage({ beginQuiz: value })} />
          <TextField label="Locked browser title" value={paywall.mapPage.seoLockedTitle} onChange={(value) => patchMapPage({ seoLockedTitle: value })} />
          <TextField label="Search description" rows={3} value={paywall.mapPage.seoDescription} onChange={(value) => patchMapPage({ seoDescription: value })} />
          <TextField label="Eyebrow" value={paywall.mapPage.eyebrow} onChange={(value) => patchMapPage({ eyebrow: value })} />
          <TextField label="Teaser heading" value={paywall.mapPage.teaserHeading} onChange={(value) => patchMapPage({ teaserHeading: value })} />
          <TextField label="Teaser body" rows={4} value={paywall.mapPage.teaserBody} onChange={(value) => patchMapPage({ teaserBody: value })} />
          <TextField label="Teaser: ego roles" value={paywall.mapPage.teaserRoles} onChange={(value) => patchMapPage({ teaserRoles: value })} />
          <TextField label="Teaser: Beebe roles" value={paywall.mapPage.teaserBeebe} onChange={(value) => patchMapPage({ teaserBeebe: value })} />
          <TextField label="Teaser: close scores" value={paywall.mapPage.teaserCloseFallback} onChange={(value) => patchMapPage({ teaserCloseFallback: value })} />
          <TextField label="Teaser: chapters" value={paywall.mapPage.teaserChapters} onChange={(value) => patchMapPage({ teaserChapters: value })} />
          <TextField label="Back to free results" value={paywall.mapPage.backToResults} onChange={(value) => patchMapPage({ backToResults: value })} />
          <TextField label="Compatibility eyebrow" value={paywall.mapPage.compatEyebrow} onChange={(value) => patchMapPage({ compatEyebrow: value })} />
          <TextField label="Compatibility title" value={paywall.mapPage.compatTitle} onChange={(value) => patchMapPage({ compatTitle: value })} />
          <TextField label="Compatibility body" rows={4} value={paywall.mapPage.compatBody} onChange={(value) => patchMapPage({ compatBody: value })} />
          <TextField label="Compatibility button" value={paywall.mapPage.compatCta} onChange={(value) => patchMapPage({ compatCta: value })} />
          <TextField label="Disclaimer" rows={3} value={paywall.mapPage.disclaimer} onChange={(value) => patchMapPage({ disclaimer: value })} />
          <TextField label="Print button" value={paywall.mapPage.print} onChange={(value) => patchMapPage({ print: value })} />
          <TextField label="Back to results" value={paywall.mapPage.backToResultsButton} onChange={(value) => patchMapPage({ backToResultsButton: value })} />
          <TextField label="Compatibility toolbar" value={paywall.mapPage.compatButton} onChange={(value) => patchMapPage({ compatButton: value })} />
        </fieldset>
      ) : (
        <fieldset className="cms-card">
          <legend>Compatibility page</legend>
          <TextField label="Empty browser title" value={paywall.compatPage.emptySeoTitle} onChange={(value) => patchCompatPage({ emptySeoTitle: value })} />
          <TextField label="Empty search description" rows={3} value={paywall.compatPage.emptySeoDescription} onChange={(value) => patchCompatPage({ emptySeoDescription: value })} />
          <TextField label="Empty title" value={paywall.compatPage.emptyTitle} onChange={(value) => patchCompatPage({ emptyTitle: value })} />
          <TextField label="Empty stat" value={paywall.compatPage.emptyStat} onChange={(value) => patchCompatPage({ emptyStat: value })} />
          <TextField label="Empty body" rows={3} value={paywall.compatPage.emptyBody} onChange={(value) => patchCompatPage({ emptyBody: value })} />
          <TextField label="Begin-quiz button" value={paywall.compatPage.beginQuiz} onChange={(value) => patchCompatPage({ beginQuiz: value })} />
          <TextField label="Locked browser title" value={paywall.compatPage.seoLockedTitle} onChange={(value) => patchCompatPage({ seoLockedTitle: value })} />
          <TextField label="Search description" rows={3} value={paywall.compatPage.seoDescription} onChange={(value) => patchCompatPage({ seoDescription: value })} />
          <TextField label="Eyebrow" value={paywall.compatPage.eyebrow} onChange={(value) => patchCompatPage({ eyebrow: value })} />
          <TextField label="Unlocked heading" value={paywall.compatPage.heading} onChange={(value) => patchCompatPage({ heading: value })} />
          <TextField label="Disclaimer" rows={3} value={paywall.compatPage.disclaimer} onChange={(value) => patchCompatPage({ disclaimer: value })} />
          <TextField label="Print button" value={paywall.compatPage.print} onChange={(value) => patchCompatPage({ print: value })} />
          <TextField label="Back to results" value={paywall.compatPage.backToResultsButton} onChange={(value) => patchCompatPage({ backToResultsButton: value })} />
          <TextField label="Map button" value={paywall.compatPage.mapButton} onChange={(value) => patchCompatPage({ mapButton: value })} />
          <TextField label="Back link (locked)" value={paywall.compatPage.backLink} onChange={(value) => patchCompatPage({ backLink: value })} />
        </fieldset>
      )}
    </div>
  )
}

function TypesEditor({
  types,
  setTypes,
  typeCode,
  setTypeCode,
  password,
  writable,
  onMessage,
}: {
  types: TypeContent[]
  setTypes: (types: TypeContent[]) => void
  typeCode: string
  setTypeCode: (code: string) => void
  password: string
  writable: boolean
  onMessage: (message: string) => void
}) {
  const selected = types.find((type) => type.code === typeCode) ?? types[0]
  if (!selected) return null

  function patch(partial: Partial<TypeContent>) {
    setTypes(types.map((type) => (type.code === selected.code ? { ...type, ...partial } : type)))
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    onMessage('')
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Could not read that file'))
        reader.readAsDataURL(file)
      })
      const image = await uploadCmsImage(selected.code, dataUrl, password)
      patch({ image })
      onMessage('Image saved. Click Save to keep it on this type.')
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  return (
    <div className="cms-panel">
      <p className="cms-note">
        Title and summary appear on the free results page and on{' '}
        <code>/types/{selected.code.toLowerCase()}</code>. The longer essays appear on the map.
        Leave the image blank to keep the function sketch, or upload a picture (png, jpg, webp,
        gif, or svg, under 2 MB). The stack stays fixed so scoring still works.
      </p>
      <div className="cms-chips" role="tablist" aria-label="Type">
        {types.map((type) => (
          <button
            key={type.code}
            type="button"
            className={typeCode === type.code ? 'is-active' : undefined}
            onClick={() => setTypeCode(type.code)}
          >
            {type.code}
          </button>
        ))}
      </div>
      <p className="cms-subhead">
        {selected.code} — {selected.title} · {selected.stack.join(' → ')}
      </p>
      <fieldset className="cms-card">
        <legend>Image</legend>
        <div className="cms-image-preview">
          {selected.image ? (
            <img src={selected.image} alt="" />
          ) : (
            <p className="cms-note">Using the {selected.stack[0]} sketch until you add a picture.</p>
          )}
        </div>
        <TextField
          label="Image URL or path"
          value={selected.image}
          onChange={(value) => patch({ image: value })}
          hint="Upload below, or paste a path such as /types/INTJ.png"
        />
        <Field label="Upload a picture">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            disabled={!writable}
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </Field>
        {selected.image ? (
          <button type="button" className="cms-text-btn" onClick={() => patch({ image: '' })}>
            Use the function sketch again
          </button>
        ) : null}
      </fieldset>
      <fieldset className="cms-card">
        <legend>Free results</legend>
        <TextField label="Title" value={selected.title} onChange={(value) => patch({ title: value })} />
        <TextField label="Short name" value={selected.name} onChange={(value) => patch({ name: value })} />
        <TextField
          label="Summary"
          rows={5}
          value={selected.summary}
          onChange={(value) => patch({ summary: value })}
        />
      </fieldset>
      <fieldset className="cms-card">
        <legend>Map reading</legend>
        <TextField label="The type" rows={6} value={selected.myth} onChange={(value) => patch({ myth: value })} />
        <TextField
          label="The tension"
          rows={6}
          value={selected.tension}
          onChange={(value) => patch({ tension: value })}
        />
        <TextField
          label="In the day"
          rows={6}
          value={selected.inTheDay}
          onChange={(value) => patch({ inTheDay: value })}
        />
        <TextField label="At work" rows={6} value={selected.atWork} onChange={(value) => patch({ atWork: value })} />
        <TextField
          label="With others"
          rows={6}
          value={selected.withOthers}
          onChange={(value) => patch({ withOthers: value })}
        />
        <TextField label="Growth" rows={6} value={selected.growth} onChange={(value) => patch({ growth: value })} />
        <TextField
          label="Shadow work"
          rows={6}
          value={selected.shadowWork}
          onChange={(value) => patch({ shadowWork: value })}
        />
        {selected.prompts.map((prompt, index) => (
          <TextField
            key={index}
            label={`Prompt ${index + 1}`}
            rows={3}
            value={prompt}
            onChange={(value) => {
              const prompts = selected.prompts.map((item, itemIndex) =>
                itemIndex === index ? value : item,
              )
              patch({ prompts })
            }}
          />
        ))}
        <button
          type="button"
          className="cms-text-btn"
          onClick={() => patch({ prompts: [...selected.prompts, ''] })}
        >
          Add a prompt
        </button>
        {selected.prompts.length > 1 ? (
          <button
            type="button"
            className="cms-text-btn"
            onClick={() => patch({ prompts: selected.prompts.slice(0, -1) })}
          >
            Remove last prompt
          </button>
        ) : null}
      </fieldset>
    </div>
  )
}

function GuidesEditor({
  guides,
  setGuides,
  guideSlug,
  setGuideSlug,
}: {
  guides: Guide[]
  setGuides: (guides: Guide[]) => void
  guideSlug: string
  setGuideSlug: (slug: string) => void
}) {
  const selected = guides.find((guide) => guide.slug === guideSlug) ?? guides[0]
  if (!selected) return null

  function replace(next: Guide, previousSlug = selected.slug) {
    setGuides(
      guides.map((guide) => {
        if (guide.slug === previousSlug) return next
        return {
          ...guide,
          related: guide.related.map((item) => (item === previousSlug ? next.slug : item)),
        }
      }),
    )
    setGuideSlug(next.slug)
  }

  function patch(partial: Partial<Guide>) {
    replace({ ...selected, ...partial })
  }

  return (
    <div className="cms-panel">
      <p className="cms-note">
        Each article becomes a public page at <code>/{'{slug}'}</code>, is listed on{' '}
        <code>/guides</code>, and is added to the sitemap when you save. Use a short slug such as{' '}
        <code>ni-vs-ne</code>. After you deploy, Google can read the new page.
      </p>
      <div className="cms-chips" role="tablist" aria-label="Guide">
        {guides.map((guide) => (
          <button
            key={guide.slug}
            type="button"
            className={guideSlug === guide.slug ? 'is-active' : undefined}
            onClick={() => setGuideSlug(guide.slug)}
          >
            {guide.slug}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="cms-text-btn"
        onClick={() => {
          const created = emptyGuide(guides)
          setGuides([...guides, created])
          setGuideSlug(created.slug)
        }}
      >
        Add an article
      </button>
      {guides.length > 1 ? (
        <button
          type="button"
          className="cms-text-btn"
          onClick={() => {
            const next = guides.filter((guide) => guide.slug !== selected.slug)
            setGuides(next)
            setGuideSlug(next[0]?.slug ?? '')
          }}
        >
          Delete this article
        </button>
      ) : null}
      <fieldset className="cms-card">
        <legend>Search</legend>
        <TextField
          label="URL slug"
          value={selected.slug}
          onChange={(value) => patch({ slug: value.trim().toLowerCase() })}
          hint="Letters, numbers, and hyphens only. This is the page address."
        />
        <TextField
          label="Browser title"
          value={selected.seoTitle}
          onChange={(value) => patch({ seoTitle: value })}
        />
        <TextField
          label="Search description"
          rows={3}
          value={selected.seoDescription}
          onChange={(value) => patch({ seoDescription: value })}
        />
      </fieldset>
      <fieldset className="cms-card">
        <legend>Page</legend>
        <TextField label="Eyebrow" value={selected.eyebrow} onChange={(value) => patch({ eyebrow: value })} />
        <TextField label="Title" value={selected.title} onChange={(value) => patch({ title: value })} />
        <TextField label="Stat line" value={selected.stat} onChange={(value) => patch({ stat: value })} />
        <TextField label="Lede" rows={4} value={selected.lede} onChange={(value) => patch({ lede: value })} />
      </fieldset>
      {selected.sections.map((section, index) => (
        <fieldset key={index} className="cms-card">
          <legend>Section {index + 1}</legend>
          <TextField
            label="Heading"
            value={section.heading}
            onChange={(value) => {
              const sections = selected.sections.map((item, itemIndex) =>
                itemIndex === index ? { ...item, heading: value } : item,
              )
              patch({ sections })
            }}
          />
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <TextField
              key={paragraphIndex}
              label={`Paragraph ${paragraphIndex + 1}`}
              rows={6}
              value={paragraph}
              onChange={(value) => {
                const sections = selected.sections.map((item, itemIndex) => {
                  if (itemIndex !== index) return item
                  const paragraphs = item.paragraphs.map((entry, entryIndex) =>
                    entryIndex === paragraphIndex ? value : entry,
                  )
                  return { ...item, paragraphs }
                })
                patch({ sections })
              }}
            />
          ))}
          <button
            type="button"
            className="cms-text-btn"
            onClick={() => {
              const sections = selected.sections.map((item, itemIndex) =>
                itemIndex === index ? { ...item, paragraphs: [...item.paragraphs, ''] } : item,
              )
              patch({ sections })
            }}
          >
            Add a paragraph
          </button>
          <button
            type="button"
            className="cms-text-btn"
            onClick={() =>
              patch({ sections: selected.sections.filter((_, itemIndex) => itemIndex !== index) })
            }
          >
            Remove this section
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="cms-text-btn"
        onClick={() =>
          patch({ sections: [...selected.sections, { heading: '', paragraphs: [''] }] })
        }
      >
        Add a section
      </button>
      <fieldset className="cms-card">
        <legend>Related guides</legend>
        {guides
          .filter((guide) => guide.slug !== selected.slug)
          .map((guide) => (
            <label key={guide.slug} className="cms-check">
              <input
                type="checkbox"
                checked={selected.related.includes(guide.slug)}
                onChange={(event) => {
                  const related = event.target.checked
                    ? [...selected.related, guide.slug]
                    : selected.related.filter((item) => item !== guide.slug)
                  patch({ related })
                }}
              />
              {guide.title}
            </label>
          ))}
      </fieldset>
    </div>
  )
}

function QuizEditor({
  questions,
  setQuestions,
  functionId,
  setFunctionId,
}: {
  questions: QuestionsContent
  setQuestions: (questions: QuestionsContent) => void
  functionId: FunctionId
  setFunctionId: (id: FunctionId) => void
}) {
  const items = questions[functionId]

  return (
    <div className="cms-panel">
      <p className="cms-note">
        Each function keeps six statements, and the last one should stay reverse-keyed so the
        scoring still balances. The id stays the same even if you change the wording, so answers
        already stored in a browser still match.
      </p>
      <div className="cms-chips" role="tablist" aria-label="Function">
        {FUNCTION_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={functionId === id ? 'is-active' : undefined}
            onClick={() => setFunctionId(id)}
          >
            {id}
          </button>
        ))}
      </div>
      <p className="cms-subhead">
        {FUNCTIONS[functionId].name} — {FUNCTIONS[functionId].role}
      </p>
      {items.map((item, index) => (
        <fieldset key={`${functionId}-${index}`} className="cms-card">
          <legend>
            {`q-${functionId}-${index + 1}`}
          </legend>
          <Field label="Facet">
            <select
              value={item.facet}
              onChange={(event) => {
                const facet = event.target.value as QuestionFacet
                const next = {
                  ...questions,
                  [functionId]: items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, facet, reverse: facet === 'reverse' ? true : undefined }
                      : entry,
                  ),
                }
                setQuestions(next)
              }}
            >
              {FACETS.map((facet) => (
                <option key={facet} value={facet}>
                  {facet}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Statement">
            <textarea
              rows={4}
              value={item.text}
              onChange={(event) => {
                const next = {
                  ...questions,
                  [functionId]: items.map((entry, entryIndex) =>
                    entryIndex === index ? { ...entry, text: event.target.value } : entry,
                  ),
                }
                setQuestions(next)
              }}
            />
          </Field>
        </fieldset>
      ))}
    </div>
  )
}

function FollowupEditor({
  followup,
  setFollowup,
  pairKey,
  setPairKey,
  pairKeys,
  pairBank,
  left,
  right,
}: {
  followup: FollowupContent
  setFollowup: (followup: FollowupContent) => void
  pairKey: string
  setPairKey: (key: string) => void
  pairKeys: string[]
  pairBank: 'attitude' | 'rival'
  left: string
  right: string
}) {
  const items = followup[pairBank][pairKey] ?? []

  return (
    <div className="cms-panel">
      <p className="cms-note">
        These are the forced-choice items used when two functions land close together. The first
        option is {left}; the second is {right}.
      </p>
      <div className="cms-chips" role="tablist" aria-label="Follow-up pair">
        {pairKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={pairKey === key ? 'is-active' : undefined}
            onClick={() => setPairKey(key)}
          >
            {key}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <fieldset key={`${pairKey}-${index}`} className="cms-card">
          <legend>Item {index + 1}</legend>
          <Field label="Prompt">
            <input
              value={item.prompt}
              onChange={(event) => {
                const nextItems = items.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, prompt: event.target.value } : entry,
                )
                setFollowup({
                  ...followup,
                  [pairBank]: { ...followup[pairBank], [pairKey]: nextItems },
                })
              }}
            />
          </Field>
          <Field label={`${left} choice`}>
            <textarea
              rows={3}
              value={item.aText}
              onChange={(event) => {
                const nextItems = items.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, aText: event.target.value } : entry,
                )
                setFollowup({
                  ...followup,
                  [pairBank]: { ...followup[pairBank], [pairKey]: nextItems },
                })
              }}
            />
          </Field>
          <Field label={`${right} choice`}>
            <textarea
              rows={3}
              value={item.bText}
              onChange={(event) => {
                const nextItems = items.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, bText: event.target.value } : entry,
                )
                setFollowup({
                  ...followup,
                  [pairBank]: { ...followup[pairBank], [pairKey]: nextItems },
                })
              }}
            />
          </Field>
        </fieldset>
      ))}
    </div>
  )
}
