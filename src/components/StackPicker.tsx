import { FUNCTIONS, type FunctionId } from '../data/functions'
import { TypePortrait } from './TypePortrait'
import {
  closeLeaders,
  parentForHeroAnima,
  parentForHeroChild,
  preferredParent,
  validAnimasForHero,
  validChildrenForHero,
  validParentsForHero,
  type FunctionScore,
} from '../lib/scoring'

type StackPickerProps = {
  scores: FunctionScore[]
  hero: FunctionId
  parent: FunctionId
  child?: FunctionId
  anima?: FunctionId
  full?: boolean
  preview?: {
    code: string
    title: string
    summary: string
    image?: string
  }
  onHeroChange: (hero: FunctionId) => void
  onParentChange: (parent: FunctionId) => void
}

export function StackPicker({
  scores,
  hero,
  parent,
  child,
  anima,
  full = false,
  preview,
  onHeroChange,
  onParentChange,
}: StackPickerProps) {
  const percentById = Object.fromEntries(scores.map((score) => [score.id, score.percent])) as Record<
    FunctionId,
    number
  >
  const close = closeLeaders(scores)
  const parents = validParentsForHero(hero)
  const children = validChildrenForHero(hero)
  const animas = validAnimasForHero(hero)
  const tied =
    close.length >= 2 &&
    Math.abs((percentById[close[0] ?? hero] ?? 0) - (percentById[close[1] ?? hero] ?? 0)) <= 12

  return (
    <article className="panel stack-picker">
      <h2>Arrange by strength</h2>
      <p className="panel__intro">
        {full
          ? tied
            ? 'Two or more functions scored close together, so you can name the lead, the support, the third, and the inferior, and each valid set is a different type.'
            : 'Choose the four ego functions in the order of their strength, and the support, the third, and the inferior will stay a valid complement to the lead you pick.'
          : tied
            ? 'Two or more functions scored close together, so pick the leading function first, then the one that supports it.'
            : 'Choose which function leads, and the supporting function must be the other kind of process — judging with perceiving — and the opposite attitude.'}
      </p>

      <RoleRow
        label="Leading function (Hero)"
        group="Leading function"
        options={scores.map((score) => score.id)}
        selected={hero}
        percentById={percentById}
        close={close}
        suggestedId={scores[0]?.id}
        onPick={onHeroChange}
      />

      <RoleRow
        label="Supporting function (Parent)"
        group="Supporting function"
        options={parents}
        selected={parent}
        percentById={percentById}
        close={parents}
        suggestedId={preferredParent(hero, scores)}
        onPick={onParentChange}
      />

      {full && child && anima ? (
        <>
          <RoleRow
            label="Relief function (Child)"
            group="Child function"
            options={children}
            selected={child}
            percentById={percentById}
            close={children}
            suggestedId={children.slice().sort((a, b) => (percentById[b] ?? 0) - (percentById[a] ?? 0))[0]}
            onPick={(next) => {
              const nextParent = parentForHeroChild(hero, next)
              if (nextParent) onParentChange(nextParent)
            }}
          />

          <RoleRow
            label="Inferior function (Anima)"
            group="Anima function"
            options={animas}
            selected={anima}
            percentById={percentById}
            close={animas}
            suggestedId={animas.slice().sort((a, b) => (percentById[b] ?? 0) - (percentById[a] ?? 0))[0]}
            onPick={(next) => {
              const nextParent = parentForHeroAnima(hero, next)
              if (nextParent) onParentChange(nextParent)
            }}
          />
        </>
      ) : null}

      {preview ? (
        <div className="result-preview" key={preview.code}>
          <div className="sketch-stage sketch-stage--mini">
            <TypePortrait hero={hero} image={preview.image} className="sketch--mini" />
          </div>
          <h3 className="result-preview__title">
            {preview.code} — {preview.title}
          </h3>
          <p className="mono-stat">
            {preview.code.toLowerCase()} · hero {hero} ({percentById[hero] ?? 0}%) · parent {parent}{' '}
            ({percentById[parent] ?? 0}%)
          </p>
          <p className="result-preview__lede">{preview.summary}</p>
        </div>
      ) : null}
    </article>
  )
}

type RoleRowProps = {
  label: string
  group: string
  options: FunctionId[]
  selected: FunctionId
  percentById: Record<FunctionId, number>
  close: FunctionId[]
  suggestedId?: FunctionId
  onPick: (id: FunctionId) => void
}

function RoleRow({
  label,
  group,
  options,
  selected,
  percentById,
  close,
  suggestedId,
  onPick,
}: RoleRowProps) {
  return (
    <>
      <p className="stack-picker__label">{label}</p>
      <div className="choice-row" role="group" aria-label={group}>
        {options.map((id) => {
          const fn = FUNCTIONS[id]
          const percent = percentById[id] ?? 0
          const isClose = close.includes(id)
          const suggested = suggestedId === id && id !== selected
          return (
            <button
              key={id}
              type="button"
              className={
                selected === id ? 'choice-chip is-selected' : isClose ? 'choice-chip is-close' : 'choice-chip'
              }
              onClick={() => onPick(id)}
            >
              <strong>{fn.id}</strong>
              <span>
                {percent}%{suggested ? ' · stronger' : ''}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
