import { FUNCTIONS } from '../data/functions'
import type { FunctionScore } from '../lib/scoring'

type ScoreBarProps = {
  score: FunctionScore
}

export function ScoreBar({ score }: ScoreBarProps) {
  const fn = FUNCTIONS[score.id]
  const width = Math.max(score.percent, 3)

  return (
    <div className="score-bar">
      <div className="score-bar__label">
        <strong>{fn.id}</strong>
        <span>{fn.name}</span>
        <span className="score-bar__percent">{score.percent}%</span>
      </div>
      <div className="score-bar__track" aria-hidden="true">
        <div className="score-bar__fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
