import type { HourTag, HourWeather } from '../../lib/workspace/types'

const LANES: { id: HourWeather; title: string; y: number }[] = [
  { id: 'ordinary', title: 'Ordinary', y: 22 },
  { id: 'loop', title: 'Loop', y: 70 },
  { id: 'grip', title: 'Grip', y: 118 },
]

const Y: Record<HourWeather, number> = {
  ordinary: 22,
  loop: 70,
  grip: 118,
}

const LEFT = 78
const RIGHT = 312
const WIDTH = 320
const HEIGHT = 148

function day(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function JournalGraph({
  hours,
  selected,
  onSelect,
}: {
  hours: HourTag[]
  selected: HourWeather | null
  onSelect: (weather: HourWeather) => void
}) {
  const points = [...hours].sort((a, b) => a.at.localeCompare(b.at))
  const last = points.length - 1
  const xAt = (index: number) =>
    last <= 0 ? (LEFT + RIGHT) / 2 : LEFT + (index / last) * (RIGHT - LEFT)
  const plotted = points.map((tag, index) => ({
    tag,
    x: xAt(index),
    y: Y[tag.weather],
  }))
  const line = plotted.map((point) => `${point.x},${point.y}`).join(' ')
  const ticks =
    last <= 0 ? [0] : last === 1 ? [0, 1] : [0, Math.round(last / 2), last]
  const uniqueTicks = [...new Set(ticks)].filter((index, _, all) => {
    const label = day(points[index].at)
    return all.find((item) => day(points[item].at) === label) === index
  })

  return (
    <div className="workspace-plot">
      <p className="workspace-chart__caption">Ordinary up. Grip down.</p>
      <svg
        className="workspace-plot__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Ordinary, loop, and grip over the hours you have kept."
      >
        {LANES.map((lane) => (
          <g key={lane.id}>
            <line
              className="workspace-plot__grid"
              x1={LEFT}
              x2={RIGHT}
              y1={lane.y}
              y2={lane.y}
            />
            <text
              className={
                selected === lane.id
                  ? 'workspace-plot__label is-on'
                  : 'workspace-plot__label'
              }
              x={0}
              y={lane.y + 4}
              onClick={() => onSelect(lane.id)}
            >
              {lane.title}
            </text>
          </g>
        ))}
        {plotted.length > 1 ? (
          <polyline className="workspace-plot__line" points={line} />
        ) : null}
        {plotted.map((point) => (
          <circle
            key={point.tag.id}
            className={
              selected === point.tag.weather
                ? 'workspace-plot__dot is-on'
                : 'workspace-plot__dot'
            }
            cx={point.x}
            cy={point.y}
            r={selected === point.tag.weather ? 5.5 : 4}
            onClick={() => onSelect(point.tag.weather)}
          >
            <title>
              {day(point.tag.at)} · {point.tag.weather}
            </title>
          </circle>
        ))}
        {uniqueTicks.map((index) => (
          <text
            key={`${points[index].id}-tick`}
            className="workspace-plot__tick"
            x={xAt(index)}
            y={HEIGHT - 4}
            textAnchor="middle"
          >
            {day(points[index].at)}
          </text>
        ))}
      </svg>
    </div>
  )
}
