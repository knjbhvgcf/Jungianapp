import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CompatReading } from '../components/CompatReading'
import { UnlockPanel } from '../components/UnlockPanel'
import { Button } from '../components/Button'
import { Editable, EditableButton, EditHint, EditSeo } from '../components/Editable'
import { Seo } from '../components/Seo'
import { TypePortrait } from '../components/TypePortrait'
import { Sparkle } from '../components/Icons'
import {
  buildProfile,
  isQuizComplete,
  matchForSpine,
  preferredParent,
  validParentsForHero,
} from '../lib/scoring'
import { applyFollowUpToProfile } from '../lib/clarify'
import { loadAnswers, loadClarifyAnswers, loadStackChoice } from '../lib/storage'
import { asPersonality, useEditMode, useSiteCopy, useTypeDraft } from '../lib/editMode'
import { isProductUnlocked, tryUnlockKey, TYPE_IN_DEPTH_PATH } from '../lib/unlock'

export function Compatibility() {
  const [params] = useSearchParams()
  const { editing, previewType, patchPages } = useEditMode()
  const compatPage = useSiteCopy().paywall.compatPage
  const draft = useTypeDraft(previewType)
  const [unlocked, setUnlocked] = useState(() => {
    if (isProductUnlocked('compat')) return true
    const key = new URLSearchParams(window.location.search).get('key')
    return Boolean(key && tryUnlockKey(key, 'compat'))
  })
  const answers = useMemo(() => loadAnswers(), [])
  const complete = isQuizComplete(answers)
  const clarify = useMemo(() => loadClarifyAnswers(), [])
  const profile = useMemo(
    () => (complete ? applyFollowUpToProfile(buildProfile(answers), clarify) : null),
    [answers, complete, clarify],
  )
  const stored = useMemo(() => loadStackChoice(), [])

  useEffect(() => {
    const fromUrl = params.get('key')
    if (fromUrl && tryUnlockKey(fromUrl, 'compat')) setUnlocked(true)
  }, [params])

  function patchCompat(partial: Partial<typeof compatPage>) {
    patchPages((pages) => ({
      ...pages,
      paywall: { ...pages.paywall, compatPage: { ...pages.paywall.compatPage, ...partial } },
    }))
  }

  if ((!complete || !profile) && !editing) {
    return (
      <>
        <Seo
          title={compatPage.emptySeoTitle}
          description={compatPage.emptySeoDescription}
          path="/compatibility"
        />
        <section className="section">
          <div className="wrap screen empty-state">
            {unlocked ? (
              <>
                <h1 className="serif-title">Unlocked — quiz missing in this tab</h1>
                <p className="mono-stat">compatibility follows the type you scored</p>
                <p>
                  Payment worked. If the results tab is still open, refresh it, then open
                  compatibility again. Otherwise take the quiz once more here.
                </p>
                <Button to="/results">Open results</Button>
                <Button to="/quiz" variant="ghost">
                  {compatPage.beginQuiz}
                </Button>
              </>
            ) : (
              <>
                <h1 className="serif-title">{compatPage.emptyTitle}</h1>
                <p className="mono-stat">{compatPage.emptyStat}</p>
                <p>{compatPage.emptyBody}</p>
                <Button to="/quiz">{compatPage.beginQuiz}</Button>
              </>
            )}
          </div>
        </section>
      </>
    )
  }

  const defaultHero = profile?.matches[0]?.stack[0]
  const hero = stored?.hero ?? defaultHero ?? draft?.stack[0]
  const parents = hero && profile ? validParentsForHero(hero) : []
  const parent =
    stored && hero === stored.hero && parents.includes(stored.parent)
      ? stored.parent
      : hero && profile
        ? preferredParent(hero, profile.scores)
        : draft?.stack[1]
  const quizSelected =
    hero && parent && profile ? matchForSpine(profile.matches, hero, parent) : profile?.matches[0]
  const selected = editing && draft ? asPersonality(draft) : quizSelected
  const showUnlocked = unlocked || editing

  if (!selected || !hero || !parent) return null

  const typeImage = selected.image

  return (
    <>
      <Seo
        title={
          showUnlocked ? `${selected.title} compatibility | Jung Functions Quiz` : compatPage.seoLockedTitle
        }
        description={compatPage.seoDescription}
        path="/compatibility"
      />

      <article className="section dossier">
        <header className="wrap screen dossier-hero">
          {editing && !complete ? (
            <div className="edit-empty-preview">
              <EditHint>Shown when someone has not finished the quiz</EditHint>
              <EditSeo
                title={compatPage.emptySeoTitle}
                description={compatPage.emptySeoDescription}
                onTitle={(emptySeoTitle) => patchCompat({ emptySeoTitle })}
                onDescription={(emptySeoDescription) => patchCompat({ emptySeoDescription })}
              />
              <Editable
                as="h1"
                className="serif-title"
                label="Empty title"
                value={compatPage.emptyTitle}
                onChange={(emptyTitle) => patchCompat({ emptyTitle })}
              />
              <Editable
                as="p"
                className="mono-stat"
                label="Empty stat"
                multiline={false}
                value={compatPage.emptyStat}
                onChange={(emptyStat) => patchCompat({ emptyStat })}
              />
              <Editable
                as="p"
                label="Empty body"
                value={compatPage.emptyBody}
                onChange={(emptyBody) => patchCompat({ emptyBody })}
              />
              <EditableButton
                to="/quiz"
                label="Begin quiz"
                value={compatPage.beginQuiz}
                onChange={(beginQuiz) => patchCompat({ beginQuiz })}
              />
            </div>
          ) : null}
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <TypePortrait hero={hero} image={typeImage} alt={`${selected.code} ${selected.title}`} />
          </div>
          <Editable
            as="p"
            className="eyebrow"
            label="Eyebrow"
            multiline={false}
            value={compatPage.eyebrow}
            onChange={(eyebrow) => patchCompat({ eyebrow })}
          />
          <h1 className="serif-title">
            {selected.code} — {selected.title}
          </h1>
          <p className="mono-stat">
            {selected.code.toLowerCase()} · {hero} → {parent}
          </p>
          <p className="lede">{selected.summary}</p>
        </header>

        <div className="wrap prose dossier-body">
          {showUnlocked && quizSelected ? (
            <>
              <section>
                <Editable
                  as="h2"
                  label="Heading"
                  value={compatPage.heading}
                  onChange={(heading) => patchCompat({ heading })}
                />
                <CompatReading type={quizSelected} />
              </section>
              <Editable
                as="p"
                className="note"
                label="Disclaimer"
                value={compatPage.disclaimer}
                onChange={(disclaimer) => patchCompat({ disclaimer })}
              />
              <div className="dossier-toolbar">
                <EditableButton
                  label="Print"
                  value={compatPage.print}
                  onClick={() => window.print()}
                  onChange={(print) => patchCompat({ print })}
                />
                <EditableButton
                  to="/results"
                  variant="ghost"
                  label="Back to results"
                  value={compatPage.backToResultsButton}
                  onChange={(backToResultsButton) => patchCompat({ backToResultsButton })}
                />
                <EditableButton
                  to={TYPE_IN_DEPTH_PATH}
                  variant="ghost"
                  label="Map button"
                  value={compatPage.mapButton}
                  onChange={(mapButton) => patchCompat({ mapButton })}
                />
              </div>
            </>
          ) : (
            <>
              <UnlockPanel product="compat" onUnlocked={() => setUnlocked(true)} />
              {editing ? (
                <Editable
                  as="p"
                  className="text-link"
                  label="Back link"
                  multiline={false}
                  value={compatPage.backLink}
                  onChange={(backLink) => patchCompat({ backLink })}
                />
              ) : (
                <p>
                  <Link to="/results" className="text-link">
                    {compatPage.backLink}
                  </Link>
                </p>
              )}
            </>
          )}
          {editing && quizSelected ? (
            <>
              <EditHint>Unlock card visitors see before they pay</EditHint>
              <UnlockPanel product="compat" onUnlocked={() => setUnlocked(true)} />
            </>
          ) : null}
        </div>
      </article>
    </>
  )
}
