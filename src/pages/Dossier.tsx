import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArchetypeSheet } from '../components/ArchetypeSheet'
import { MapExtras, MapExtrasTeaser } from '../components/MapExtras'
import { UnlockPanel } from '../components/UnlockPanel'
import { Button } from '../components/Button'
import { Editable, EditableButton, EditHint, EditSeo } from '../components/Editable'
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
import {
  asPersonality,
  chaptersFrom,
  useEditMode,
  useSiteCopy,
  useTypeDraft,
} from '../lib/editMode'
import { isProductUnlocked, productHref, tryUnlockKey, TYPE_IN_DEPTH_PATH } from '../lib/unlock'
import type { PersonalityType } from '../data/personalityTypes'
import type { TypeMapCopy } from '../data/typeMaps'
import type { BeebePlacement, FunctionScore, TypeMatch } from '../lib/scoring'
import type { TieBreakReading } from '../lib/tieBreak'

export function Dossier() {
  const [params] = useSearchParams()
  const { editing, previewType, patchPages } = useEditMode()
  const mapPage = useSiteCopy().paywall.mapPage
  const draft = useTypeDraft(previewType)
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

  function patchMap(partial: Partial<typeof mapPage>) {
    patchPages((pages) => ({
      ...pages,
      paywall: { ...pages.paywall, mapPage: { ...pages.paywall.mapPage, ...partial } },
    }))
  }

  if ((!complete || !profile) && !editing) {
    return (
      <>
        <Seo
          title={mapPage.emptySeoTitle}
          description={mapPage.emptySeoDescription}
          path={TYPE_IN_DEPTH_PATH}
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
  const quizSelected =
    hero && parent && profile ? matchForSpine(profile.matches, hero, parent) : profile?.matches[0]
  const runnerUp = profile?.matches.find((match) => match.code !== quizSelected?.code)
  const selected = editing && draft ? asPersonality(draft) : quizSelected
  const copy = editing && draft ? chaptersFrom(draft) : selected ? typeCopy(selected.code) : undefined

  if (!selected || !hero || !parent) return null

  const scores = profile?.scores ?? []
  const beebe = profile && quizSelected ? beebePlacements(quizSelected, scores) : []
  const typeImage = selected.image
  const showUnlocked = unlocked || editing

  function chooseHero(next: FunctionId) {
    if (!profile) return
    const nextParent = preferredParent(next, scores)
    setHeroId(next)
    setParentId(nextParent)
    saveStackChoice({ hero: next, parent: nextParent })
  }

  function chooseParent(next: FunctionId) {
    if (!hero) return
    setParentId(next)
    saveStackChoice({ hero, parent: next })
  }

  return (
    <>
      <Seo
        title={
          showUnlocked ? `${selected.title} in depth | Jung Functions Quiz` : mapPage.seoLockedTitle
        }
        description={mapPage.seoDescription}
        path={TYPE_IN_DEPTH_PATH}
      />

      <article className="section dossier">
        <header className="wrap screen dossier-hero">
          {editing && !complete ? (
            <div className="edit-empty-preview">
              <EditHint>Shown when someone has not finished the quiz</EditHint>
              <EditSeo
                title={mapPage.emptySeoTitle}
                description={mapPage.emptySeoDescription}
                onTitle={(emptySeoTitle) => patchMap({ emptySeoTitle })}
                onDescription={(emptySeoDescription) => patchMap({ emptySeoDescription })}
              />
              <Editable
                as="h1"
                className="serif-title"
                label="Empty title"
                value={mapPage.emptyTitle}
                onChange={(emptyTitle) => patchMap({ emptyTitle })}
              />
              <Editable
                as="p"
                className="mono-stat"
                label="Empty stat"
                multiline={false}
                value={mapPage.emptyStat}
                onChange={(emptyStat) => patchMap({ emptyStat })}
              />
              <Editable
                as="p"
                label="Empty body"
                value={mapPage.emptyBody}
                onChange={(emptyBody) => patchMap({ emptyBody })}
              />
              <EditableButton
                to="/quiz"
                label="Begin quiz"
                value={mapPage.beginQuiz}
                onChange={(beginQuiz) => patchMap({ beginQuiz })}
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
            value={mapPage.eyebrow}
            onChange={(eyebrow) => patchMap({ eyebrow })}
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
          {showUnlocked ? (
            <UnlockedReading
              selected={selected}
              copy={copy}
              mapPage={mapPage}
              quizSelected={quizSelected}
              scores={scores}
              beebe={beebe}
              readings={readings}
              hero={hero}
              parent={parent}
              typeImage={typeImage}
              runnerUp={runnerUp}
              patchMap={patchMap}
              onHeroChange={chooseHero}
              onParentChange={chooseParent}
            />
          ) : (
            <>
              {quizSelected ? (
                <MapExtrasTeaser selected={quizSelected} readings={readings} />
              ) : null}
              <UnlockPanel product="map" onUnlocked={() => setUnlocked(true)} />
              <p>
                <Link to="/results" className="text-link">
                  {mapPage.backToResults}
                </Link>
              </p>
            </>
          )}
          {editing ? (
            <>
              <EditHint>Unlock card visitors see before they pay</EditHint>
              <UnlockPanel product="map" onUnlocked={() => setUnlocked(true)} />
            </>
          ) : null}
        </div>
      </article>
    </>
  )
}

function UnlockedReading({
  selected,
  copy,
  mapPage,
  quizSelected,
  scores,
  beebe,
  readings,
  hero,
  parent,
  typeImage,
  runnerUp,
  patchMap,
  onHeroChange,
  onParentChange,
}: {
  selected: PersonalityType
  copy: TypeMapCopy | undefined
  mapPage: ReturnType<typeof useSiteCopy>['paywall']['mapPage']
  quizSelected?: TypeMatch
  scores: FunctionScore[]
  beebe: BeebePlacement[]
  readings: TieBreakReading[]
  hero: FunctionId
  parent: FunctionId
  typeImage?: string
  runnerUp?: TypeMatch
  patchMap: (partial: Partial<ReturnType<typeof useSiteCopy>['paywall']['mapPage']>) => void
  onHeroChange: (hero: FunctionId) => void
  onParentChange: (parent: FunctionId) => void
}) {
  const { editing, previewType, patchType } = useEditMode()
  const compatUnlocked = isProductUnlocked('compat')

  return (
    <>
      {quizSelected && scores.length ? (
        <MapExtras
          selected={quizSelected}
          scores={scores}
          beebe={beebe}
          readings={readings}
          hero={hero}
          parent={parent}
          image={typeImage}
          onHeroChange={onHeroChange}
          onParentChange={onParentChange}
        />
      ) : null}
      <ArchetypeSheet type={selected} />
      {copy ? (
        <section>
          <h2>The type</h2>
          <Editable
            as="p"
            label="The type"
            value={copy.myth}
            onChange={(myth) => patchType(previewType, (type) => ({ ...type, myth }))}
          />
          <h2>The tension</h2>
          <Editable
            as="p"
            label="The tension"
            value={copy.tension}
            onChange={(tension) => patchType(previewType, (type) => ({ ...type, tension }))}
          />
          <h2>In the day</h2>
          <Editable
            as="p"
            label="In the day"
            value={copy.inTheDay}
            onChange={(inTheDay) => patchType(previewType, (type) => ({ ...type, inTheDay }))}
          />
          <h2>At work</h2>
          <Editable
            as="p"
            label="At work"
            value={copy.atWork}
            onChange={(atWork) => patchType(previewType, (type) => ({ ...type, atWork }))}
          />
          <h2>With others</h2>
          <Editable
            as="p"
            label="With others"
            value={copy.withOthers}
            onChange={(withOthers) => patchType(previewType, (type) => ({ ...type, withOthers }))}
          />
          <h2>Growth</h2>
          <Editable
            as="p"
            label="Growth"
            value={copy.growth}
            onChange={(growth) => patchType(previewType, (type) => ({ ...type, growth }))}
          />
          <h2>Shadow work</h2>
          <Editable
            as="p"
            label="Shadow work"
            value={copy.shadowWork}
            onChange={(shadowWork) => patchType(previewType, (type) => ({ ...type, shadowWork }))}
          />
          <h2>Prompts</h2>
          <ol className="dossier-prompts">
            {copy.prompts.map((prompt, index) => (
              <Editable
                key={index}
                as="li"
                label={`Prompt ${index + 1}`}
                value={prompt}
                onChange={(next) =>
                  patchType(previewType, (type) => ({
                    ...type,
                    prompts: type.prompts.map((entry, entryIndex) =>
                      entryIndex === index ? next : entry,
                    ),
                  }))
                }
              />
            ))}
          </ol>
        </section>
      ) : null}

      <aside className="upsell">
        <Editable
          as="p"
          className="eyebrow"
          label="Compat eyebrow"
          multiline={false}
          value={mapPage.compatEyebrow}
          onChange={(compatEyebrow) => patchMap({ compatEyebrow })}
        />
        <Editable
          as="h2"
          label="Compat title"
          value={mapPage.compatTitle}
          onChange={(compatTitle) => patchMap({ compatTitle })}
        />
        <Editable
          as="p"
          label="Compat body"
          value={mapPage.compatBody}
          onChange={(compatBody) => patchMap({ compatBody })}
        />
        <EditableButton
          to={productHref('compat', compatUnlocked)}
          label="Compat CTA"
          value={mapPage.compatCta}
          onChange={(compatCta) => patchMap({ compatCta })}
        />
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
      <Editable
        as="p"
        className="note"
        label="Disclaimer"
        value={mapPage.disclaimer}
        onChange={(disclaimer) => patchMap({ disclaimer })}
      />
      <div className="dossier-toolbar">
        <EditableButton
          label="Print"
          value={mapPage.print}
          onClick={() => window.print()}
          onChange={(print) => patchMap({ print })}
        />
        <EditableButton
          to="/results"
          variant="ghost"
          label="Back to results"
          value={mapPage.backToResultsButton}
          onChange={(backToResultsButton) => patchMap({ backToResultsButton })}
        />
        <EditableButton
          to="/compatibility"
          variant="ghost"
          label="Compat button"
          value={mapPage.compatButton}
          onChange={(compatButton) => patchMap({ compatButton })}
        />
      </div>
      {editing && !quizSelected ? (
        <EditHint>Stack tools appear here after a quiz is finished on this browser.</EditHint>
      ) : null}
    </>
  )
}
