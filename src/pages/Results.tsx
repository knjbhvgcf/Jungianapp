import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Sparkle } from '../components/Icons'
import { ScoreBar } from '../components/ScoreBar'
import { Seo } from '../components/Seo'
import { TypePortrait } from '../components/TypePortrait'
import { StackPicker } from '../components/StackPicker'
import { FUNCTIONS, type FunctionId } from '../data/functions'
import {
  buildProfile,
  isQuizComplete,
  matchForSpine,
  preferredParent,
  validParentsForHero,
} from '../lib/scoring'
import { applyFollowUp, applyFollowUpToProfile, needsFollowUp } from '../lib/clarify'
import { closeAttitudeReadings, suggestedHeroFromTieBreak } from '../lib/tieBreak'
import {
  clearAnswers,
  loadAnswers,
  loadClarifyAnswers,
  loadStackChoice,
  saveStackChoice,
} from '../lib/storage'
import { fillCopy, siteCopy } from '../lib/copy'
import { isProductUnlocked, productPrice } from '../lib/unlock'

const results = siteCopy.results

export function Results() {
  const navigate = useNavigate()
  const answers = useMemo(() => loadAnswers(), [])
  const complete = isQuizComplete(answers)
  const clarify = useMemo(() => loadClarifyAnswers(), [])
  const baseProfile = useMemo(() => (complete ? buildProfile(answers) : null), [answers, complete])
  const profile = useMemo(
    () => (baseProfile ? applyFollowUpToProfile(baseProfile, clarify) : null),
    [baseProfile, clarify],
  )
  const stored = useMemo(() => loadStackChoice(), [])
  const [copied, setCopied] = useState(false)
  const [heroId, setHeroId] = useState<FunctionId | null>(null)
  const [parentId, setParentId] = useState<FunctionId | null>(null)
  const readings = useMemo(
    () =>
      baseProfile && profile
        ? closeAttitudeReadings(answers, baseProfile.scores).map((reading) =>
            applyFollowUp(reading, clarify, profile.scores),
          )
        : [],
    [answers, baseProfile, profile, clarify],
  )
  const mapUnlocked = isProductUnlocked('map')
  const compatUnlocked = isProductUnlocked('compat')
  const mapPrice = productPrice('map')
  const compatPrice = productPrice('compat')

  if (complete && needsFollowUp(answers, clarify)) {
    return <Navigate to="/clarify" replace />
  }

  if (!complete || !profile) {
    return (
      <>
        <Seo
          title={results.seoTitleEmpty}
          description={results.seoDescriptionEmpty}
          path="/results"
        />
        <section className="section">
          <div className="wrap screen empty-state">
            <h1 className="serif-title">{results.emptyTitle}</h1>
            <p className="mono-stat">{results.emptyStat}</p>
            <p>{results.emptyBody}</p>
            <Button to="/quiz">{results.beginQuiz}</Button>
          </div>
        </section>
      </>
    )
  }

  const suggestedHero = suggestedHeroFromTieBreak(readings, profile.scores)
  const defaultHero = stored?.hero ?? suggestedHero ?? profile.matches[0]?.stack[0]
  const hero = heroId ?? stored?.hero ?? defaultHero
  const parents = hero ? validParentsForHero(hero) : []
  const parent =
    parentId && parents.includes(parentId)
      ? parentId
      : stored && hero === stored.hero && parents.includes(stored.parent)
        ? stored.parent
        : hero
          ? preferredParent(hero, profile.scores)
          : undefined

  const selected =
    hero && parent ? matchForSpine(profile.matches, hero, parent) : profile.matches[0]
  const [algorithmTop, runnerUp, third] = profile.matches
  if (!selected || !hero || !parent || !algorithmTop || !runnerUp) return null

  const selectedCode = selected.code
  const selectedTitle = selected.title
  const selectedConfidence = selected.confidence
  const selectedSummary = selected.summary

  const heroFn = selected.stack[0]
  const parentFn = selected.stack[1]
  const leadScore = profile.scores.find((score) => score.id === heroFn)
  const closeSecond = algorithmTop.confidence - runnerUp.confidence <= 8
  const differentiation = profile.differentiation
  const scoreLines = profile.scores.map((score) => `${score.id} ${score.percent}%`)
  const allScores = profile.scores
  const sketchKind = heroFn
  const typeImage = selected.image

  function chooseHero(next: FunctionId) {
    const nextParent = preferredParent(next, allScores)
    setHeroId(next)
    setParentId(nextParent)
    saveStackChoice({ hero: next, parent: nextParent })
  }

  function chooseParent(next: FunctionId) {
    setParentId(next)
    saveStackChoice({ hero, parent: next })
  }

  async function copySummary() {
    const lines = [
      `Jung Functions · Psychological Types + Beebe`,
      `${selectedCode} ${selectedTitle} (${selectedConfidence}% fit)`,
      `Hero: ${heroFn} · Parent: ${parentFn}`,
      `Differentiation: ${differentiation}`,
      '',
      ...scoreLines,
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <Seo
        title={fillCopy(results.seoTitle, { code: selectedCode, title: selectedTitle })}
        description={fillCopy(results.seoDescription, { heroName: FUNCTIONS[heroFn].name })}
        path="/results"
      />

      <section className="section results">
        <div className="wrap screen">
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <Sparkle className="sparkle sparkle--3" />
            <Sparkle className="sparkle sparkle--4" />
            <TypePortrait hero={sketchKind} image={typeImage} />
          </div>
          <h1 className="serif-title">
            {selectedCode} — {selectedTitle}
          </h1>
          <p className="mono-stat">
            {selectedCode.toLowerCase()} · hero {heroFn} ({leadScore?.percent ?? 0}%) · parent{' '}
            {parentFn}
          </p>
          <p className="lede">{selectedSummary}</p>
          {closeSecond || readings.length ? (
            <p className="note">
              {readings.length
                ? readings
                    .map((reading) =>
                      reading.stillTied
                        ? `${reading.pair.a} and ${reading.pair.b} stayed close even after the follow-up.`
                        : `${reading.pair.a} and ${reading.pair.b} were close, and the follow-up names ${reading.winner} as the lead.`,
                    )
                    .join(' ')
                : `${results.alsoClosePrefix} ${runnerUp.code}${third ? `, then ${third.code}` : ''}.`}{' '}
              {results.closeNote}
            </p>
          ) : null}
          <div className="hero__actions">
            <Button
              variant="ghost"
              onClick={() =>
                document.getElementById('stack')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              {results.arrangeStack}
            </Button>
            <Button to="/dossier">{mapUnlocked ? results.openMap : results.unlockMap}</Button>
            <Button to="/compatibility" variant="ghost">
              {compatUnlocked ? results.openCompat : results.compatShort}
            </Button>
          </div>
        </div>

        <div className="wrap results-grid">
          <div className="results-column">
            <article className="panel">
              <h2>{results.scoresHeading}</h2>
              <p className="panel__intro">{results.scoresIntro}</p>
              <div className="score-list">
                {allScores.map((score) => (
                  <ScoreBar key={score.id} score={score} />
                ))}
              </div>
            </article>
            <div id="stack">
              <StackPicker
                scores={allScores}
                hero={hero}
                parent={parent}
                preview={{
                  code: selectedCode,
                  title: selectedTitle,
                  summary: selectedSummary,
                  image: typeImage,
                }}
                onHeroChange={chooseHero}
                onParentChange={chooseParent}
              />
            </div>
          </div>
        </div>

        <div className="wrap upsell-grid">
          <aside className="upsell">
            <p className="eyebrow">{results.mapEyebrow}</p>
            <h2>{mapUnlocked ? results.mapTitle : results.mapTitleLocked}</h2>
            <p>
              {mapUnlocked
                ? results.mapBodyUnlocked
                : fillCopy(results.mapBodyLocked, { price: mapPrice })}
            </p>
            <Button to="/dossier">
              {mapUnlocked
                ? results.mapCtaUnlocked
                : fillCopy(results.mapCtaLocked, { price: mapPrice })}
            </Button>
          </aside>
          <aside className="upsell">
            <p className="eyebrow">{results.compatEyebrow}</p>
            <h2>{results.compatTitle}</h2>
            <p>
              {compatUnlocked
                ? results.compatBodyUnlocked
                : fillCopy(results.compatBodyLocked, { price: compatPrice })}
            </p>
            <Button to="/compatibility">
              {compatUnlocked
                ? results.compatCtaUnlocked
                : fillCopy(results.compatCtaLocked, { price: compatPrice })}
            </Button>
          </aside>
        </div>

        <div className="wrap results-actions">
          <Button to="/quiz">{results.retake}</Button>
          <Button
            variant="ghost"
            onClick={() => {
              clearAnswers()
              navigate('/quiz')
            }}
          >
            {results.clearAnswers}
          </Button>
          <Button variant="ghost" onClick={copySummary}>
            {copied ? results.copied : results.copySummary}
          </Button>
          <Link to="/about" className="text-link">
            {results.methodLink}
          </Link>
        </div>
      </section>
    </>
  )
}
