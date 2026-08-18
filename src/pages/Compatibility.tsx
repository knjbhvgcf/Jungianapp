import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CompatReading } from '../components/CompatReading'
import { UnlockPanel } from '../components/UnlockPanel'
import { Button } from '../components/Button'
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
import { siteCopy } from '../lib/copy'
import { isProductUnlocked, tryUnlockKey } from '../lib/unlock'
import { loadPortraitChoice, portraitSrc } from '../lib/portrait'

const compatPage = siteCopy.paywall.compatPage

export function Compatibility() {
  const [params] = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => isProductUnlocked('compat'))
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

  if (!complete || !profile) {
    return (
      <>
        <Seo
          title={compatPage.emptySeoTitle}
          description={compatPage.emptySeoDescription}
          path="/compatibility"
        />
        <section className="section">
          <div className="wrap screen empty-state">
            <h1 className="serif-title">{compatPage.emptyTitle}</h1>
            <p className="mono-stat">{compatPage.emptyStat}</p>
            <p>{compatPage.emptyBody}</p>
            <Button to="/quiz">{compatPage.beginQuiz}</Button>
          </div>
        </section>
      </>
    )
  }

  const defaultHero = profile.matches[0]?.stack[0]
  const hero = stored?.hero ?? defaultHero
  const parents = hero ? validParentsForHero(hero) : []
  const parent =
    stored && hero === stored.hero && parents.includes(stored.parent)
      ? stored.parent
      : hero
        ? preferredParent(hero, profile.scores)
        : undefined
  const selected =
    hero && parent ? matchForSpine(profile.matches, hero, parent) : profile.matches[0]

  if (!selected || !hero || !parent) return null

  const typeImage = portraitSrc(selected.code, loadPortraitChoice(), selected.image)

  return (
    <>
      <Seo
        title={
          unlocked ? `${selected.title} compatibility | Jung Functions` : compatPage.seoLockedTitle
        }
        description={compatPage.seoDescription}
        path="/compatibility"
      />

      <article className="section dossier">
        <header className="wrap screen dossier-hero">
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <TypePortrait hero={hero} image={typeImage} alt={`${selected.code} ${selected.title}`} />
          </div>
          <p className="eyebrow">{compatPage.eyebrow}</p>
          <h1 className="serif-title">
            {selected.code} — {selected.title}
          </h1>
          <p className="mono-stat">
            {selected.code.toLowerCase()} · {hero} → {parent}
          </p>
          <p className="lede">{selected.summary}</p>
        </header>

        <div className="wrap prose dossier-body">
          {unlocked ? (
            <>
              <section>
                <h2>{compatPage.heading}</h2>
                <CompatReading type={selected} />
              </section>
              <p className="note">{compatPage.disclaimer}</p>
              <div className="dossier-toolbar">
                <Button onClick={() => window.print()}>{compatPage.print}</Button>
                <Button to="/results" variant="ghost">
                  {compatPage.backToResultsButton}
                </Button>
                <Button to="/dossier" variant="ghost">
                  {compatPage.mapButton}
                </Button>
              </div>
            </>
          ) : (
            <>
              <UnlockPanel product="compat" onUnlocked={() => setUnlocked(true)} />
              <p>
                <Link to="/results" className="text-link">
                  {compatPage.backLink}
                </Link>
              </p>
            </>
          )}
        </div>
      </article>
    </>
  )
}
