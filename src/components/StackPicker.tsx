import { Link } from 'react-router-dom'
import { FUNCTIONS, type FunctionId } from '../data/functions'
import { typePath } from '../data/personalityTypes'
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
  hideHeading?: boolean
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
  hideHeading = false,
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
      {hideHeading ? null : <h2>Try a different lead</h2>}
      <p className="panel__intro">
        {full
          ? tied
            ? 'Two functions scored close, so you can try another lead and support. Each valid pair is a different type.'
            : 'Pick the function that leads, then the one that supports it. The rest of the stack follows from that pair.'
          : tied
            ? 'Two functions scored close. Pick the one that leads, then the one that supports it.'
            : 'Pick the function that leads, then the one that supports it.'}
      </p>

      <RoleRow
        label={full ? 'Hero / Heroine (1st position)' : 'Leads'}
        group="Hero / Heroine"
        options={scores.map((score) => score.id)}
        selected={hero}
        percentById={percentById}
        close={close}
        suggestedId={scores[0]?.id}
        onPick={onHeroChange}
      />

      <RoleRow
        label={full ? 'Parent (2nd position)' : 'Supports'}
        group="Parent"
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
            label="Eternal Child (3rd position)"
            group="Eternal Child"
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
            label="Inferior (Anima / Animus) (4th position)"
            group="Inferior"
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
            <Link to={typePath(preview.code)}>
              {preview.code} — {preview.title}
            </Link>
          </h3>
          <p className="mono-stat">
            {preview.code.toLowerCase()} · Hero / Heroine {hero} ({percentById[hero] ?? 0}%) · Parent{' '}
            {parent} ({percentById[parent] ?? 0}%)
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
