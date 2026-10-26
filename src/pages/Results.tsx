import { useEffect, useMemo, useState } from 'react'
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
  chooseFreeTier,
  clearAnswers,
  isFreeTierChosen,
  loadAnswers,
  loadClarifyAnswers,
  loadStackChoice,
  saveStackChoice,
} from '../lib/storage'
import { trackBeginCheckout, trackPurchase } from '../lib/analytics'
import { fillCopy } from '../lib/copy'
import { asPersonality, useEditMode, useSiteCopy, useTypeDraft } from '../lib/editMode'
import {
  COMPATIBILITY_OFFERED,
  isProductUnlocked,
  isTypeRevealUnlocked,
  productHref,
  productPrice,
  tryUnlockTypeReveal,
} from '../lib/unlock'
import { typePath } from '../data/personalityTypes'
import { PopulationShare } from '../components/PopulationShare'
import { reportTypeCensus } from '../lib/typeCensus'
import { QUIZ_PATH } from '../lib/quizPath'
import { WORKSPACE_JOIN_PATH, WORKSPACE_OFFERED, WORKSPACE_PATH, WORKSPACE_PRICE } from '../lib/workspace/offered'
import { encodeShareLine } from '../lib/workspace/sharePacket'
import { loadResultSnapshot, snapshotFromType } from '../lib/workspace/snapshot'
import { saveSelfSnapshot, useHouse } from '../lib/workspace/store'

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
  const [offerDismissed, setOfferDismissed] = useState(() => {
    if (typeof window === 'undefined') return isFreeTierChosen()
    if (isFreeTierChosen() || isTypeRevealUnlocked()) return true
    const key = new URLSearchParams(window.location.search).get('key')
    if (key && tryUnlockTypeReveal(key)) {
      chooseFreeTier()
      if (!editing) trackPurchase('reveal')
      return true
    }
    return false
  })
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
    if (editing || !complete || !profile) return
    const suggestedCode = profile.matches[0]?.code
    if (!suggestedCode) return
    const suggestedHero = suggestedHeroFromTieBreak(readings, profile.scores)
    const nextHero = heroId ?? stored?.hero ?? suggestedHero ?? profile.matches[0]?.stack[0]
    if (!nextHero) return
    const parents = validParentsForHero(nextHero)
    const nextParent =
      parentId && parents.includes(parentId)
        ? parentId
        : stored && nextHero === stored.hero && parents.includes(stored.parent)
          ? stored.parent
          : preferredParent(nextHero, profile.scores, profile.pairs)
    const chosen = matchForSpine(profile.matches, nextHero, nextParent) ?? profile.matches[0]
    const selectedCode = chosen?.code
    if (!selectedCode) return
    void reportTypeCensus({ suggested: suggestedCode, selected: selectedCode })
  }, [clarify, complete, editing, heroId, parentId, profile, readings, stored])
  const compatUnlocked = isProductUnlocked('compat')
  const showCompat = COMPATIBILITY_OFFERED || compatUnlocked || editing
  const compatPrice = productPrice('compat')
  const previewOffer =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('offer') === '1'
  const showGate = WORKSPACE_OFFERED && ((complete && !offerDismissed) || previewOffer)
  const house = useHouse()
  const saveHref = house ? WORKSPACE_PATH : WORKSPACE_JOIN_PATH

  function patchResults(partial: Partial<typeof results>) {
    patchPages((pages) => ({ ...pages, results: { ...pages.results, ...partial } }))
  }

  function stayOnFree() {
    chooseFreeTier()
    setOfferDismissed(true)
  }

  function saveResults(event?: { preventDefault: () => void }) {
    const snapshot = loadResultSnapshot()
    if (house?.self && snapshot && house.self.code !== snapshot.code) {
      event?.preventDefault()
      if (!window.confirm(`Replace ${house.self.code} on Me with ${snapshot.code}?`)) return
      saveSelfSnapshot(snapshot)
      navigate(WORKSPACE_PATH)
      return
    }
    if (snapshot && house) saveSelfSnapshot(snapshot)
  }

  const gatePopup = (
    <div className="results-popup" role="dialog" aria-modal="true" aria-labelledby="results-popup-title">
      <div className="results-popup__card">
        <div className="results-popup__intro">
          {editing ? (
            <Editable
              as="h1"
              className="serif-title"
              label="Offer title"
              value={results.offerTitle}
              onChange={(offerTitle) => patchResults({ offerTitle })}
            />
          ) : (
            <h1 id="results-popup-title" className="serif-title">
              {results.offerTitle}
            </h1>
          )}
          {editing ? (
            <Editable
              as="p"
              className="mono-stat"
              label="Offer price"
              multiline={false}
              value={results.offerStat}
              onChange={(offerStat) => patchResults({ offerStat })}
            />
          ) : (
            <p className="mono-stat">{fillCopy(results.offerStat, { price: WORKSPACE_PRICE })}</p>
          )}
          {editing ? (
            <Editable
              as="p"
              className="note"
              label="Offer note"
              multiline={false}
              value={results.offerNote}
              onChange={(offerNote) => patchResults({ offerNote })}
            />
          ) : (
            <p className="note">{results.offerNote}</p>
          )}
        </div>
        {editing ? (
          <EditableButton
            to={saveHref}
            label="Save results CTA"
            value={results.offerCta}
            onChange={(offerCta) => patchResults({ offerCta })}
          />
        ) : (
          <Button to={saveHref} onClick={saveResults}>
            {results.offerCta}
          </Button>
        )}
        {editing ? (
          <Editable
            as="span"
            className="stay-free"
            label="See it free"
            multiline={false}
            value={results.stayFree}
            onChange={(stayFree) => patchResults({ stayFree })}
          />
        ) : (
          <button type="button" className="stay-free" onClick={stayOnFree}>
            {results.stayFree}
          </button>
        )}
      </div>
    </div>
  )

  if (complete && needsFollowUp(answers, clarify) && !editing && !previewOffer) {
    return <Navigate to="/clarify" replace />
  }

  if (showGate && !editing) {
    return (
      <>
        <Seo
          title={results.seoTitleEmpty}
          description={results.seoDescriptionEmpty}
          path="/results"
          robots="noindex,follow"
        />
        <section className="section results results-gate">{gatePopup}</section>
      </>
    )
  }

  if ((!complete || !profile) && !editing) {
    return (
      <>
        <Seo
          title={results.seoTitleEmpty}
          description={results.seoDescriptionEmpty}
          path="/results"
          robots="noindex,follow"
        />
        <section className="section">
          <div className="wrap screen empty-state">
            <h1 className="serif-title">{results.emptyTitle}</h1>
            <p className="mono-stat">{results.emptyStat}</p>
            <p>{results.emptyBody}</p>
            <Button to={QUIZ_PATH}>{results.beginQuiz}</Button>
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
          ? preferredParent(hero, profile.scores, profile.pairs)
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
  const populationPercent = editing
    ? preview.populationPercent
    : selected?.populationPercent ?? preview.populationPercent
  const leadScore = profile?.scores.find((score) => score.id === heroFn)
  const closeSecond =
    algorithmTop && runnerUp ? algorithmTop.confidence - runnerUp.confidence <= 8 : false
  const differentiation = profile?.differentiation
  const scoreLines = profile?.scores.map((score) => `${score.id} ${score.percent}%`) ?? []
  const allScores = profile?.scores ?? []
  const typeImage = editing ? preview.image : selected?.image ?? preview.image

  function chooseHero(next: FunctionId) {
    if (!profile) return
    const nextParent = preferredParent(next, allScores, profile.pairs)
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
    const percents = Object.fromEntries((profile?.scores ?? []).map((score) => [score.id, score.percent]))
    const shareBase = snapshotFromType(selectedCode)
    const share = shareBase && profile ? encodeShareLine({ ...shareBase, percents }) : ''
    const lines = [
      ...(share ? [share, ''] : []),
      `Jungology · Jung Functions Quiz · Psychological Types + Beebe`,
      `${selectedCode} ${selectedTitle} (${selectedConfidence}% fit)`,
      `Hero / Heroine: ${heroFn} · Parent: ${parentFn}`,
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
        robots="noindex,follow"
      />

      <section className={`section results${editing ? ' results-gate-edit' : ''}`}>
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
              to={QUIZ_PATH}
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
            {selectedCode.toLowerCase()} · {heroFn}
            {leadScore ? ` ${leadScore.percent}%` : ''} with {parentFn}
            {populationPercent != null ? (
              <>
                {' · '}
                <PopulationShare
                  percent={populationPercent}
                  onChange={(next) =>
                    patchType(previewType, (type) => ({ ...type, populationPercent: next }))
                  }
                />
              </>
            ) : null}
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
            {WORKSPACE_OFFERED ? (
              <Button to={saveHref} onClick={saveResults}>
                {results.offerCta}
              </Button>
            ) : null}
            <Button to={typePath(selectedCode)} variant="ghost">
              {selectedTitle} page
            </Button>
            {showCompat ? (
              <EditableButton
                to={productHref('compat', compatUnlocked)}
                variant="ghost"
                label={compatUnlocked ? 'Open compat' : 'Compat short'}
                value={compatUnlocked ? results.openCompat : results.compatShort}
                onClick={
                  compatUnlocked
                    ? undefined
                    : () => trackBeginCheckout('compat', productHref('compat', false))
                }
                onChange={(value) =>
                  patchResults(compatUnlocked ? { openCompat: value } : { compatShort: value })
                }
              />
            ) : null}
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
            </div>
          </div>
        ) : null}

        {WORKSPACE_OFFERED || showCompat ? (
        <div className="wrap upsell-grid">
          {WORKSPACE_OFFERED ? (
            <aside className="upsell">
              {editing ? (
                <Editable
                  as="p"
                  className="eyebrow"
                  label="Save eyebrow"
                  multiline={false}
                  value={results.saveEyebrow}
                  onChange={(saveEyebrow) => patchResults({ saveEyebrow })}
                />
              ) : (
                <p className="eyebrow">{results.saveEyebrow}</p>
              )}
              {editing ? (
                <Editable
                  as="h2"
                  label="Offer title"
                  value={results.offerTitle}
                  onChange={(offerTitle) => patchResults({ offerTitle })}
                />
              ) : (
                <h2>{results.offerTitle}</h2>
              )}
              {editing ? (
                <Editable
                  as="p"
                  label="Save body"
                  value={results.saveBody}
                  onChange={(saveBody) => patchResults({ saveBody })}
                />
              ) : (
                <p>{fillCopy(results.saveBody, { price: WORKSPACE_PRICE })}</p>
              )}
              <p className="mono-stat">{fillCopy(results.offerStat, { price: WORKSPACE_PRICE })}</p>
              <p className="note">{results.offerNote}</p>
              <Button to={saveHref} onClick={saveResults}>
                {results.offerCta}
              </Button>
            </aside>
          ) : null}
          {showCompat ? (
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
                to={productHref('compat', compatUnlocked)}
                label="Compat CTA"
                value={
                  compatUnlocked
                    ? results.compatCtaUnlocked
                    : fillCopy(results.compatCtaLocked, { price: compatPrice })
                }
                onClick={
                  compatUnlocked
                    ? undefined
                    : () => trackBeginCheckout('compat', productHref('compat', false))
                }
                onChange={(value) =>
                  patchResults(
                    compatUnlocked ? { compatCtaUnlocked: value } : { compatCtaLocked: value },
                  )
                }
              />
            </aside>
          ) : null}
        </div>
        ) : null}

        {profile && selected && hero && parent ? (
          <div className="wrap" id="stack">
            <details className="stack-fold" open={editing || undefined}>
              <summary>
                <Editable
                  as="span"
                  label="Arrange stack"
                  multiline={false}
                  value={results.arrangeStack}
                  onChange={(arrangeStack) => patchResults({ arrangeStack })}
                />
              </summary>
              <StackPicker
                scores={allScores}
                hero={hero}
                parent={parent}
                hideHeading
                preview={{
                  code: selectedCode,
                  title: selectedTitle,
                  summary: selectedSummary,
                  image: typeImage,
                }}
                onHeroChange={chooseHero}
                onParentChange={chooseParent}
              />
            </details>
          </div>
        ) : null}

        <div className="wrap results-actions">
          <div className="results-actions__row">
            <EditableButton
              to={QUIZ_PATH}
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
                navigate(QUIZ_PATH)
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
          </div>
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
        {editing ? gatePopup : null}
      </section>
    </>
  )
}
