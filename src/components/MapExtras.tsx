import { useState } from 'react'
import { BeebeStack } from './BeebeStack'
import { StackPicker } from './StackPicker'
import { FUNCTIONS, type FunctionId } from '../data/functions'
import type { BeebePlacement, FunctionScore, TypeMatch } from '../lib/scoring'
import { useEditMode, useSiteCopy } from '../lib/editMode'
import { Editable } from './Editable'

type MapExtrasProps = {
  selected: TypeMatch
  scores: FunctionScore[]
  beebe: BeebePlacement[]
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
  hero,
  parent,
  image,
  onHeroChange,
  onParentChange,
}: MapExtrasProps) {
  const [order, setOrder] = useState<'roles' | 'strength'>('roles')
  const { editing } = useEditMode()

  return (
    <>
      <details className="stack-fold" open={editing || undefined}>
        <summary>Try a different lead</summary>
        <StackPicker
          scores={scores}
          hero={hero}
          parent={parent}
          child={selected.stack[2]}
          anima={selected.stack[3]}
          full
          hideHeading
          preview={{
            code: selected.code,
            title: selected.title,
            summary: selected.summary,
            image: image ?? selected.image,
          }}
          onHeroChange={onHeroChange}
          onParentChange={onParentChange}
        />
      </details>

      <details className="stack-fold" open={editing || undefined}>
        <summary>The eight roles</summary>
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
          is the working pair of this type, and the other six roles follow from that pair.
        </p>
      </details>
    </>
  )
}

export function MapExtrasTeaser({
  selected,
}: {
  selected: TypeMatch
}) {
  const [hero, parent, child, anima] = selected.stack
  const { patchPages } = useEditMode()
  const copy = useSiteCopy().paywall.mapPage

  function patch(partial: Partial<typeof copy>) {
    patchPages((pages) => ({
      ...pages,
      paywall: { ...pages.paywall, mapPage: { ...pages.paywall.mapPage, ...partial } },
    }))
  }

  return (
    <section>
      <Editable
        as="h2"
        label="Teaser heading"
        value={copy.teaserHeading}
        onChange={(teaserHeading) => patch({ teaserHeading })}
      />
      <Editable
        as="p"
        label="Teaser body"
        value={copy.teaserBody}
        onChange={(teaserBody) => patch({ teaserBody })}
      />
      <ul>
        <li>
          <Editable
            as="span"
            label="Teaser roles"
            multiline={false}
            value={copy.teaserRoles}
            onChange={(teaserRoles) => patch({ teaserRoles })}
          />
          : {hero} · {parent} · {child} · {anima}
        </li>
        <Editable
          as="li"
          label="Teaser Beebe"
          value={copy.teaserBeebe}
          onChange={(teaserBeebe) => patch({ teaserBeebe })}
        />
        <Editable
          as="li"
          label="Teaser chapters"
          value={copy.teaserChapters}
          onChange={(teaserChapters) => patch({ teaserChapters })}
        />
      </ul>
    </section>
  )
}
