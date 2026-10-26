import { BEEBE_ROLES, beebeStack } from '../../data/beebe'
import { FUNCTIONS, type FunctionId } from '../../data/functions'
import type { HourWeather, ResultSnapshot } from '../../lib/workspace/types'

const SHORT: Record<string, string> = {
  hero: 'Hero',
  parent: 'Parent',
  child: 'Child',
  anima: 'Inferior',
  opposing: 'Opposing',
  senex: 'Critic',
  trickster: 'Trickster',
  demon: 'Demon',
}

export type ChartMark = {
  index: number
  label: string
}

function hourOn(weather: HourWeather | null, index: number) {
  if (weather == null || index >= 4) return 'idle'
  const on =
    weather === 'ordinary'
      ? index === 0 || index === 1
      : weather === 'loop'
        ? index === 0 || index === 2
        : index === 3
  return on ? 'on' : 'off'
}

export function EightChart({
  stack,
  percents,
  weather = null,
  marks = [],
  selected,
  onSelect,
  caption,
  note,
  layout = 'grid',
  quiet = false,
}: {
  stack: ResultSnapshot['stack']
  percents?: ResultSnapshot['percents']
  weather?: HourWeather | null
  marks?: ChartMark[]
  selected: number | null
  onSelect: (index: number) => void
  caption?: string
  note?: string
  layout?: 'grid' | 'stack'
  quiet?: boolean
}) {
  const seats = beebeStack(stack)
  const open = selected != null ? selected : null
  const role = open != null ? BEEBE_ROLES[open] : null
  const fn = open != null ? seats[open] : null
  const mark = marks.find((item) => item.index === open)
  const stacked = layout === 'stack'
  const ringClass = stacked ? 'workspace-chart__stack' : 'workspace-chart__ring'

  return (
    <div className={stacked ? 'workspace-chart is-stack' : 'workspace-chart'}>
      {caption ? <p className="workspace-chart__caption">{caption}</p> : null}
      <div className="workspace-chart__block">
        <span className="workspace-chart__ring-label">Ego</span>
        <div className={ringClass} aria-label="Ego four">
          {seats.slice(0, 4).map((id, index) => (
            <Seat
              key={BEEBE_ROLES[index].key}
              index={index}
              id={id}
              percent={percents?.[id]}
              weather={weather}
              mark={marks.find((item) => item.index === index)}
              selected={open === index}
              onSelect={onSelect}
              stacked={stacked}
              markLabel={!stacked}
            />
          ))}
        </div>
      </div>
      <div className="workspace-chart__block">
        <span className="workspace-chart__ring-label">Shadow</span>
        <div className={`${ringClass} is-shadow`} aria-label="Shadow four">
          {seats.slice(4).map((id, index) => {
            const at = index + 4
            return (
              <Seat
                key={BEEBE_ROLES[at].key}
                index={at}
                id={id}
                percent={percents?.[id]}
                weather={weather}
                mark={marks.find((item) => item.index === at)}
                selected={open === at}
                onSelect={onSelect}
                stacked={stacked}
                markLabel={!stacked}
              />
            )
          })}
        </div>
      </div>
      {quiet ? null : role && fn ? (
        <div className="workspace-rail">
          <p className="workspace-rail__kicker">
            {fn} · {role.label}
            {typeof percents?.[fn] === 'number' ? ` · ${percents[fn]}%` : ''}
            {mark ? ` · ${mark.label}` : ''}
          </p>
          <p>{role.blurb}</p>
          <p>
            {FUNCTIONS[fn].name}. {FUNCTIONS[fn].summary}
          </p>
          {note && mark ? <p>{note}</p> : null}
        </div>
      ) : !quiet ? (
        <p className="workspace-chart__hint">Tap a seat.</p>
      ) : null}
    </div>
  )
}

function Seat({
  index,
  id,
  percent,
  weather,
  mark,
  selected,
  onSelect,
  stacked = false,
  markLabel = true,
}: {
  index: number
  id: FunctionId
  percent?: number
  weather: HourWeather | null
  mark?: ChartMark
  selected: boolean
  onSelect: (index: number) => void
  stacked?: boolean
  markLabel?: boolean
}) {
  const role = BEEBE_ROLES[index]
  const hour = hourOn(weather, index)
  const scored = typeof percent === 'number'
  const pct = scored ? <span className="workspace-node__pct">{percent}%</span> : null
  const classes = [
    'workspace-node',
    `is-${hour}`,
    mark ? 'is-mark' : '',
    selected ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected}
      aria-label={`${id}, ${role.label}${scored ? `, ${percent}%` : ''}${mark ? `, ${mark.label}` : ''}`}
      onClick={() => onSelect(index)}
    >
      <span className="workspace-node__fn">{id}</span>
      {stacked ? pct : null}
      <span className="workspace-node__role">{SHORT[role.key] ?? role.label}</span>
      {stacked ? null : pct}
      {mark && markLabel ? <em>{mark.label}</em> : null}
    </button>
  )
}
