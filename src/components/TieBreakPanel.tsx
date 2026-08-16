import { Link } from 'react-router-dom'
import { FUNCTIONS, type FunctionId } from '../data/functions'
import type { TieBreakReading } from '../lib/tieBreak'
import { Button } from './Button'

type TieBreakPanelProps = {
  readings: TieBreakReading[]
  hero: FunctionId
  onUseHero: (hero: FunctionId) => void
}

export function TieBreakPanel({ readings, hero, onUseHero }: TieBreakPanelProps) {
  if (!readings.length) return null

  return (
    <article className="panel tie-break">
      <h2>Close scores</h2>
      <p className="panel__intro">
        When two functions land together — Fi with Ti, Ni with Ne, or any other close lead — the
        first forty-eight items are not enough, so you were asked a short follow-up that forces
        a choice, and the original items are still listed below as supporting detail.
      </p>
      {readings.map((reading) => {
        const winner = FUNCTIONS[reading.winner]
        const loser = FUNCTIONS[reading.loser]
        return (
          <section key={reading.pair.key} className="tie-break__case">
            <p className="mono-stat">
              {reading.pair.a} {reading.aPercent}% · {reading.pair.b} {reading.bPercent}% ·{' '}
              {reading.pair.label}
            </p>
            <h3>
              {reading.stillTied ? 'Still too close to split' : `${winner.id} is the leading function`}
            </h3>
            <p>{reading.summary}</p>
            <ul className="tie-break__signals">
              {reading.signals.map((signal) => (
                <li key={signal.label}>
                  <strong>
                    {signal.label} → {signal.lean}
                  </strong>
                  <span>{signal.detail}</span>
                </li>
              ))}
            </ul>
            {!reading.stillTied && reading.winner !== hero ? (
              <Button onClick={() => onUseHero(reading.winner)}>
                Use {winner.id} as hero
              </Button>
            ) : null}
            {!reading.stillTied && reading.winner === hero ? (
              <p className="note">
                The stack above already leads with {winner.id}, and {loser.id} is the close twin,
                not a second hero.
              </p>
            ) : null}
            <p className="note">
              <Link to="/clarify" className="text-link">
                Answer the follow-up again
              </Link>
            </p>
          </section>
        )
      })}
    </article>
  )
}
