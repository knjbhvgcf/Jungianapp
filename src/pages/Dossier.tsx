import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArchetypeSheet } from '../components/ArchetypeSheet'
import { MapExtras, MapExtrasTeaser } from '../components/MapExtras'
import { UnlockPanel } from '../components/UnlockPanel'
import { Button } from '../components/Button'
import { Seo } from '../components/Seo'
import { TypePortrait } from '../components/TypePortrait'
import { Sparkle } from '../components/Icons'
import { typeCopy } from '../data/dossier'
import { type FunctionId } from '../data/functions'
import {
  beebePlacements,
  buildProfile,
  isQuizComplete,
  matchForSpine,
  preferredParent,
  validParentsForHero,
} from '../lib/scoring'
import { applyFollowUp, applyFollowUpToProfile } from '../lib/clarify'
import { closeAttitudeReadings, suggestedHeroFromTieBreak } from '../lib/tieBreak'
import { loadAnswers, loadClarifyAnswers, loadStackChoice, saveStackChoice } from '../lib/storage'
import { siteCopy } from '../lib/copy'
import { isProductUnlocked, tryUnlockKey } from '../lib/unlock'

const mapPage = siteCopy.paywall.mapPage

export function Dossier() {
  const [params] = useSearchParams()
  const [unlocked, setUnlocked] = useState(() => isProductUnlocked('map'))
  const answers = useMemo(() => loadAnswers(), [])
  const complete = isQuizComplete(answers)
  const clarify = useMemo(() => loadClarifyAnswers(), [])
  const baseProfile = useMemo(() => (complete ? buildProfile(answers) : null), [answers, complete])
  const profile = useMemo(
    () => (baseProfile ? applyFollowUpToProfile(baseProfile, clarify) : null),
    [baseProfile, clarify],
  )
  const stored = useMemo(() => loadStackChoice(), [])
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

  useEffect(() => {
    const fromUrl = params.get('key')
    if (fromUrl && tryUnlockKey(fromUrl, 'map')) setUnlocked(true)
  }, [params])

  if (!complete || !profile) {
    return (
      <>
        <Seo
          title={mapPage.emptySeoTitle}
          description={mapPage.emptySeoDescription}
          path="/dossier"
        />
        <section className="section">
          <div className="wrap screen empty-state">
            <h1 className="serif-title">{mapPage.emptyTitle}</h1>
            <p className="mono-stat">{mapPage.emptyStat}</p>
            <p>{mapPage.emptyBody}</p>
            <Button to="/quiz">{mapPage.beginQuiz}</Button>
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
  const runnerUp = profile.matches.find((match) => match.code !== selected?.code)

  if (!selected || !hero || !parent) return null

  const copy = typeCopy(selected.code)
  const scores = profile.scores
  const beebe = beebePlacements(selected, scores)
  const typeImage = selected.image

  function chooseHero(next: FunctionId) {
    const nextParent = preferredParent(next, scores)
    setHeroId(next)
    setParentId(nextParent)
    saveStackChoice({ hero: next, parent: nextParent })
  }

  function chooseParent(next: FunctionId) {
    setParentId(next)
    saveStackChoice({ hero, parent: next })
  }

  return (
    <>
      <Seo
        title={unlocked ? `${selected.title} map | Jung Functions` : mapPage.seoLockedTitle}
        description={mapPage.seoDescription}
        path="/dossier"
      />

      <article className="section dossier">
        <header className="wrap screen dossier-hero">
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <TypePortrait hero={hero} image={typeImage} alt={`${selected.code} ${selected.title}`} />
          </div>
          <p className="eyebrow">{mapPage.eyebrow}</p>
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
              <MapExtras
                selected={selected}
                scores={scores}
                beebe={beebe}
                readings={readings}
                hero={hero}
                parent={parent}
                image={typeImage}
                onHeroChange={chooseHero}
                onParentChange={chooseParent}
              />
              <ArchetypeSheet type={selected} />
              {copy ? (
                <section>
                  <h2>The type</h2>
                  <p>{copy.myth}</p>
                  <h2>The tension</h2>
                  <p>{copy.tension}</p>
                  <h2>In the day</h2>
                  <p>{copy.inTheDay}</p>
                  <h2>At work</h2>
                  <p>{copy.atWork}</p>
                  <h2>With others</h2>
                  <p>{copy.withOthers}</p>
                  <h2>Growth</h2>
                  <p>{copy.growth}</p>
                  <h2>Shadow work</h2>
                  <p>{copy.shadowWork}</p>
                  <h2>Prompts</h2>
                  <ol className="dossier-prompts">
                    {copy.prompts.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              <aside className="upsell">
                <p className="eyebrow">{mapPage.compatEyebrow}</p>
                <h2>{mapPage.compatTitle}</h2>
                <p>{mapPage.compatBody}</p>
                <Button to="/compatibility">{mapPage.compatCta}</Button>
              </aside>
              {runnerUp ? (
                <section>
                  <h2>Close second</h2>
                  <p>
                    The scoring model also liked <strong>{runnerUp.title}</strong> ({runnerUp.code}
                    ), hero {runnerUp.stack[0]} with parent {runnerUp.stack[1]}, and if two
                    functions scored close you can try that spine above and the chapters will
                    follow.
                  </p>
                </section>
              ) : null}
              <p className="note">{mapPage.disclaimer}</p>
              <div className="dossier-toolbar">
                <Button onClick={() => window.print()}>{mapPage.print}</Button>
                <Button to="/results" variant="ghost">
                  {mapPage.backToResultsButton}
                </Button>
                <Button to="/compatibility" variant="ghost">
                  {mapPage.compatButton}
                </Button>
              </div>
            </>
          ) : (
            <>
              <MapExtrasTeaser selected={selected} readings={readings} />
              <UnlockPanel product="map" onUnlocked={() => setUnlocked(true)} />
              <p>
                <Link to="/results" className="text-link">
                  {mapPage.backToResults}
                </Link>
              </p>
            </>
          )}
        </div>
      </article>
    </>
  )
}
