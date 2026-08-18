import { useState } from 'react'
import { BeebeStack } from './BeebeStack'
import { StackPicker } from './StackPicker'
import { TieBreakPanel } from './TieBreakPanel'
import { FUNCTIONS, type FunctionId } from '../data/functions'
import type { BeebePlacement, FunctionScore, TypeMatch } from '../lib/scoring'
import { siteCopy } from '../lib/copy'
import type { TieBreakReading } from '../lib/tieBreak'

type MapExtrasProps = {
  selected: TypeMatch
  scores: FunctionScore[]
  beebe: BeebePlacement[]
  readings: TieBreakReading[]
  hero: FunctionId
  parent: FunctionId
  image?: string
  onHeroChange: (hero: FunctionId) => void
  onParentChange: (parent: FunctionId) => void
}

export function MapExtras({
  selected,
  scores,
  beebe,
  readings,
  hero,
  parent,
  image,
  onHeroChange,
  onParentChange,
}: MapExtrasProps) {
  const [order, setOrder] = useState<'roles' | 'strength'>('roles')

  return (
    <>
      <StackPicker
        scores={scores}
        hero={hero}
        parent={parent}
        child={selected.stack[2]}
        anima={selected.stack[3]}
        full
        preview={{
          code: selected.code,
          title: selected.title,
          summary: selected.summary,
          image: image ?? selected.image,
        }}
        onHeroChange={onHeroChange}
        onParentChange={onParentChange}
      />

      <TieBreakPanel readings={readings} hero={hero} onUseHero={onHeroChange} />

      <article className="panel">
        <h2>The eight roles</h2>
        <p className="panel__intro">
          The chart follows the type you selected, and you can switch to strength order to see
          the same eight roles sorted by your scores.
        </p>
        <div className="order-toggle" role="group" aria-label="Stack order">
          <button
            type="button"
            className={order === 'roles' ? 'choice-chip is-selected' : 'choice-chip'}
            onClick={() => setOrder('roles')}
          >
            Role order
          </button>
          <button
            type="button"
            className={order === 'strength' ? 'choice-chip is-selected' : 'choice-chip'}
            onClick={() => setOrder('strength')}
          >
            Strength order
          </button>
        </div>
        <BeebeStack placements={beebe} order={order} />
        <p>
          Hero <strong>{FUNCTIONS[hero].id}</strong> with Parent <strong>{FUNCTIONS[parent].id}</strong>{' '}
          is the working spine of this type, and the other six roles follow from that pair.
        </p>
      </article>
    </>
  )
}

export function MapExtrasTeaser({
  selected,
  readings,
}: {
  selected: TypeMatch
  readings: TieBreakReading[]
}) {
  const [hero, parent, child, anima] = selected.stack
  const copy = siteCopy.paywall.mapPage
  return (
    <section>
      <h2>{copy.teaserHeading}</h2>
      <p>{copy.teaserBody}</p>
      <ul>
        <li>
          {copy.teaserRoles}: {hero} · {parent} · {child} · {anima}
        </li>
        <li>{copy.teaserBeebe}</li>
        {readings.length ? (
          <li>
            Why {readings.map((reading) => `${reading.pair.a} / ${reading.pair.b}`).join(', ')}{' '}
            scored close, and how the follow-up split them
          </li>
        ) : (
          <li>{copy.teaserCloseFallback}</li>
        )}
        <li>{copy.teaserChapters}</li>
      </ul>
    </section>
  )
}
