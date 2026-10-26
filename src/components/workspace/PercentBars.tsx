import { ScoreBar } from '../ScoreBar'
import { FUNCTION_IDS } from '../../data/functions'
import { hasPercents } from '../../lib/workspace/sharePacket'
import type { ResultSnapshot } from '../../lib/workspace/types'

export function PercentBars({
  percents,
  caption = 'Eight functions, strongest first.',
}: {
  percents?: ResultSnapshot['percents']
  caption?: string
}) {
  if (!hasPercents(percents)) return null
  const scores = FUNCTION_IDS.map((id) => ({
    id,
    raw: 0,
    percent: percents?.[id] ?? 0,
  })).sort((a, b) => b.percent - a.percent)

  return (
    <div className="workspace-scores">
      {caption ? <p className="workspace-chart__caption">{caption}</p> : null}
      <div className="score-list">
        {scores.map((score) => (
          <ScoreBar key={score.id} score={score} />
        ))}
      </div>
    </div>
  )
}
