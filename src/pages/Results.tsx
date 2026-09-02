import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Editable, EditableButton, EditHint, EditSeo } from '../components/Editable'
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
import { fillCopy } from '../lib/copy'
import { asPersonality, useEditMode, useSiteCopy, useTypeDraft } from '../lib/editMode'
import { isProductUnlocked, productPrice, TYPE_IN_DEPTH_PATH } from '../lib/unlock'
import { typePath } from '../data/personalityTypes'

export function Results() {
  const navigate = useNavigate()
  const { editing, previewType, patchPages, patchType } = useEditMode()
  const results = useSiteCopy().results
  const draft = useTypeDraft(previewType)
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

  function patchResults(partial: Partial<typeof results>) {
    patchPages((pages) => ({ ...pages, results: { ...pages.results, ...partial } }))
  }

  if (complete && needsFollowUp(answers, clarify) && !editing) {
    return <Navigate to="/clarify" replace />
  }

  if ((!complete || !profile) && !editing) {
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

  const suggestedHero = profile ? suggestedHeroFromTieBreak(readings, profile.scores) : undefined
  const defaultHero = stored?.hero ?? suggestedHero ?? profile?.matches[0]?.stack[0]
  const hero = heroId ?? stored?.hero ?? defaultHero ?? draft?.stack[0]
  const parents = hero && profile ? validParentsForHero(hero) : []
  const parent =
    parentId && parents.includes(parentId)
      ? parentId
      : stored && hero === stored.hero && parents.includes(stored.parent)
        ? stored.parent
        : hero && profile
          ? preferredParent(hero, profile.scores)
          : draft?.stack[1]

  const selected =
    hero && parent && profile ? matchForSpine(profile.matches, hero, parent) : profile?.matches[0]
  const [algorithmTop, runnerUp, third] = profile?.matches ?? []
  const preview = draft ? asPersonality(draft) : selected
  if (!preview || !hero) return null

  const selectedCode = editing ? preview.code : selected?.code ?? preview.code
  const selectedTitle = editing ? preview.title : selected?.title ?? preview.title
  const selectedConfidence = selected?.confidence ?? 0
  const selectedSummary = editing ? preview.summary : selected?.summary ?? preview.summary
  const heroFn = editing && draft ? draft.stack[0] : selected?.stack[0] ?? hero
  const parentFn = editing && draft ? draft.stack[1] : selected?.stack[1] ?? parent ?? hero
  const leadScore = profile?.scores.find((score) => score.id === heroFn)
  const closeSecond =
    algorithmTop && runnerUp ? algorithmTop.confidence - runnerUp.confidence <= 8 : false
  const differentiation = profile?.differentiation
  const scoreLines = profile?.scores.map((score) => `${score.id} ${score.percent}%`) ?? []
  const allScores = profile?.scores ?? []
  const typeImage = editing ? preview.image : selected?.image ?? preview.image

  function chooseHero(next: FunctionId) {
    if (!profile) return
    const nextParent = preferredParent(next, allScores)
    setHeroId(next)
    setParentId(nextParent)
    saveStackChoice({ hero: next, parent: nextParent })
  }

  function chooseParent(next: FunctionId) {
    if (!hero) return
    setParentId(next)
    saveStackChoice({ hero, parent: next })
  }

  async function copySummary() {
    const lines = [
      `Jung Functions · Psychological Types + Beebe`,
      `${selectedCode} ${selectedTitle} (${selectedConfidence}% fit)`,
      `Hero: ${heroFn} · Parent: ${parentFn}`,
      `Differentiation: ${differentiation ?? ''}`,
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
        title={
          complete
            ? fillCopy(results.seoTitle, { code: selectedCode, title: selectedTitle })
            : results.seoTitleEmpty
        }
        description={
          complete
            ? fillCopy(results.seoDescription, { heroName: FUNCTIONS[heroFn].name })
            : results.seoDescriptionEmpty
        }
        path="/results"
      />

      <section className="section results">
        {editing && !complete ? (
          <div className="wrap screen empty-state edit-empty-preview">
            <EditHint>Shown when someone has not finished the quiz</EditHint>
            <EditSeo
              title={results.seoTitleEmpty}
              description={results.seoDescriptionEmpty}
              onTitle={(seoTitleEmpty) => patchResults({ seoTitleEmpty })}
              onDescription={(seoDescriptionEmpty) => patchResults({ seoDescriptionEmpty })}
            />
            <Editable
              as="h1"
              className="serif-title"
              label="Empty title"
              value={results.emptyTitle}
              onChange={(emptyTitle) => patchResults({ emptyTitle })}
            />
            <Editable
              as="p"
              className="mono-stat"
              label="Empty stat"
              multiline={false}
              value={results.emptyStat}
              onChange={(emptyStat) => patchResults({ emptyStat })}
            />
            <Editable
              as="p"
              label="Empty body"
              value={results.emptyBody}
              onChange={(emptyBody) => patchResults({ emptyBody })}
            />
            <EditableButton
              to="/quiz"
              label="Begin quiz"
              value={results.beginQuiz}
              onChange={(beginQuiz) => patchResults({ beginQuiz })}
            />
          </div>
        ) : null}

        <div className="wrap screen">
          {editing ? (
            <EditHint>
              Result for {preview.code}. Use Type in the bar to switch which sprout you are editing.
            </EditHint>
          ) : null}
          <div className="sketch-stage">
            <Sparkle className="sparkle sparkle--1" />
            <Sparkle className="sparkle sparkle--2" />
            <Sparkle className="sparkle sparkle--3" />
            <Sparkle className="sparkle sparkle--4" />
            <TypePortrait
              hero={heroFn}
              image={typeImage}
              alt={`${selectedCode} ${selectedTitle}`}
            />
          </div>
          <h1 className="serif-title">
            {selectedCode} —{' '}
            <Editable
              as="span"
              label="Type title"
              value={selectedTitle}
              onChange={(title) => patchType(previewType, (type) => ({ ...type, title }))}
            />
          </h1>
          <p className="mono-stat">
            {selectedCode.toLowerCase()} · hero {heroFn}
            {leadScore ? ` (${leadScore.percent}%)` : ''} · parent {parentFn}
          </p>
          <Editable
            as="p"
            className="lede"
            label="Type summary"
            value={selectedSummary}
            onChange={(summary) => patchType(previewType, (type) => ({ ...type, summary }))}
          />
          {complete && (closeSecond || readings.length) ? (
            <p className="note">
              {readings.length
                ? readings
                    .map((reading) =>
                      reading.stillTied
                        ? `${reading.pair.a} and ${reading.pair.b} stayed close even after the follow-up.`
                        : `${reading.pair.a} and ${reading.pair.b} were close, and the follow-up names ${reading.winner} as the lead.`,
                    )
                    .join(' ')
                : `${results.alsoClosePrefix} ${runnerUp?.code}${third ? `, then ${third.code}` : ''}.`}{' '}
              {editing ? (
                <Editable
                  as="span"
                  label="Close note"
                  value={results.closeNote}
                  onChange={(closeNote) => patchResults({ closeNote })}
                />
              ) : (
                results.closeNote
              )}
            </p>
          ) : null}
          <div className="hero__actions">
            <EditableButton
              variant="ghost"
              label="Arrange stack"
              value={results.arrangeStack}
              onClick={() =>
                document.getElementById('stack')?.scrollIntoView({ behavior: 'smooth' })
              }
              onChange={(arrangeStack) => patchResults({ arrangeStack })}
            />
            <Button to={typePath(selectedCode)} variant="ghost">
              {selectedTitle} page
            </Button>
            <EditableButton
              to={TYPE_IN_DEPTH_PATH}
              label={mapUnlocked ? 'Open map' : 'Unlock map'}
              value={mapUnlocked ? results.openMap : results.unlockMap}
              onChange={(value) =>
                patchResults(mapUnlocked ? { openMap: value } : { unlockMap: value })
              }
            />
            <EditableButton
              to="/compatibility"
              variant="ghost"
              label={compatUnlocked ? 'Open compat' : 'Compat short'}
              value={compatUnlocked ? results.openCompat : results.compatShort}
              onChange={(value) =>
                patchResults(compatUnlocked ? { openCompat: value } : { compatShort: value })
              }
            />
          </div>
        </div>

        {profile && selected && hero && parent ? (
          <div className="wrap results-grid">
            <div className="results-column">
              <article className="panel">
                <Editable
                  as="h2"
                  label="Scores heading"
                  value={results.scoresHeading}
                  onChange={(scoresHeading) => patchResults({ scoresHeading })}
                />
                <Editable
                  as="p"
                  className="panel__intro"
                  label="Scores intro"
                  value={results.scoresIntro}
                  onChange={(scoresIntro) => patchResults({ scoresIntro })}
                />
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
        ) : null}

        <div className="wrap upsell-grid">
          <aside className="upsell">
            <Editable
              as="p"
              className="eyebrow"
              label="Map eyebrow"
              multiline={false}
              value={results.mapEyebrow}
              onChange={(mapEyebrow) => patchResults({ mapEyebrow })}
            />
            <Editable
              as="h2"
              label="Map title"
              value={mapUnlocked ? results.mapTitle : results.mapTitleLocked}
              onChange={(value) =>
                patchResults(mapUnlocked ? { mapTitle: value } : { mapTitleLocked: value })
              }
            />
            {editing ? (
              <Editable
                as="p"
                label="Map body"
                value={mapUnlocked ? results.mapBodyUnlocked : results.mapBodyLocked}
                onChange={(value) =>
                  patchResults(
                    mapUnlocked ? { mapBodyUnlocked: value } : { mapBodyLocked: value },
                  )
                }
              />
            ) : (
              <p>
                {mapUnlocked
                  ? results.mapBodyUnlocked
                  : fillCopy(results.mapBodyLocked, { price: mapPrice })}
              </p>
            )}
            <EditableButton
              to={TYPE_IN_DEPTH_PATH}
              label="Map CTA"
              value={
                mapUnlocked
                  ? results.mapCtaUnlocked
                  : fillCopy(results.mapCtaLocked, { price: mapPrice })
              }
              onChange={(value) =>
                patchResults(mapUnlocked ? { mapCtaUnlocked: value } : { mapCtaLocked: value })
              }
            />
          </aside>
          <aside className="upsell">
            <Editable
              as="p"
              className="eyebrow"
              label="Compat eyebrow"
              multiline={false}
              value={results.compatEyebrow}
              onChange={(compatEyebrow) => patchResults({ compatEyebrow })}
            />
            <Editable
              as="h2"
              label="Compat title"
              value={results.compatTitle}
              onChange={(compatTitle) => patchResults({ compatTitle })}
            />
            {editing ? (
              <Editable
                as="p"
                label="Compat body"
                value={compatUnlocked ? results.compatBodyUnlocked : results.compatBodyLocked}
                onChange={(value) =>
                  patchResults(
                    compatUnlocked
                      ? { compatBodyUnlocked: value }
                      : { compatBodyLocked: value },
                  )
                }
              />
            ) : (
              <p>
                {compatUnlocked
                  ? results.compatBodyUnlocked
                  : fillCopy(results.compatBodyLocked, { price: compatPrice })}
              </p>
            )}
            <EditableButton
              to="/compatibility"
              label="Compat CTA"
              value={
                compatUnlocked
                  ? results.compatCtaUnlocked
                  : fillCopy(results.compatCtaLocked, { price: compatPrice })
              }
              onChange={(value) =>
                patchResults(
                  compatUnlocked ? { compatCtaUnlocked: value } : { compatCtaLocked: value },
                )
              }
            />
          </aside>
        </div>

        <div className="wrap results-actions">
          <EditableButton
            to="/quiz"
            label="Retake"
            value={results.retake}
            onChange={(retake) => patchResults({ retake })}
          />
          <EditableButton
            variant="ghost"
            label="Clear answers"
            value={results.clearAnswers}
            onClick={() => {
              clearAnswers()
              navigate('/quiz')
            }}
            onChange={(clearAnswersLabel) => patchResults({ clearAnswers: clearAnswersLabel })}
          />
          <EditableButton
            variant="ghost"
            label="Copy summary"
            value={copied ? results.copied : results.copySummary}
            onClick={() => void copySummary()}
            onChange={(value) =>
              patchResults(copied ? { copied: value } : { copySummary: value })
            }
          />
          {editing ? (
            <Editable
              as="span"
              className="text-link"
              label="Method link"
              multiline={false}
              value={results.methodLink}
              onChange={(methodLink) => patchResults({ methodLink })}
            />
          ) : (
            <Link to="/about" className="text-link">
              {results.methodLink}
            </Link>
          )}
        </div>
      </section>
    </>
  )
}
