import { useEffect, useState } from 'react'
import { FUNCTIONS } from '../../data/functions'
import type { PersonalityType } from '../../data/personalityTypes'
import {
  compareCaption,
  compareView,
  PLACE,
  scoreLabel,
} from '../../lib/workspace/compareView'
import type { ResultSnapshot } from '../../lib/workspace/types'
import { TypePortrait } from '../TypePortrait'

export function CompatPair({
  left,
  right,
}: {
  left: { name: string; type: PersonalityType; percents?: ResultSnapshot['percents'] }
  right: { name: string; type: PersonalityType; percents?: ResultSnapshot['percents'] }
}) {
  const view = compareView(left, right)
  const [open, setOpen] = useState<number | null>(view.inLeftIndex >= 0 ? view.inLeftIndex : 0)
  const seat = open != null ? view.seats[open] : null

  useEffect(() => {
    setOpen(view.inLeftIndex >= 0 ? view.inLeftIndex : 0)
  }, [left.name, left.type.code, right.name, right.type.code, view.inLeftIndex])

  return (
    <>
      {view.inLeftIndex >= 0 ? (
        <p className="lede">
          {view.rightName === 'you' ? 'You' : view.rightName} lead
          {view.rightName === 'you' ? '' : 's'} with {right.type.stack[0]}. In {view.leftName} that is{' '}
          {view.seats[view.inLeftIndex]?.full}.
          {view.inRightIndex >= 0 ? (
            <>
              {' '}
              {view.leftName === 'you' ? 'You' : view.leftName} lead
              {view.leftName === 'you' ? '' : 's'} with {left.type.stack[0]}. In {view.rightName} that is{' '}
              {view.seats[view.inRightIndex]?.full}.
            </>
          ) : null}
        </p>
      ) : null}
      <p className="mono-stat">
        {view.reading.label}
        {view.reading.charge ? ` · ${view.reading.charge}` : ''}
      </p>
      <p className="lede">{view.reading.note}</p>
      <div className="workspace-compat-cols">
        <figure>
          <TypePortrait hero={left.type.stack[0]} image={left.type.image} alt={left.type.code} />
          <figcaption>{compareCaption(left)}</figcaption>
        </figure>
        <figure>
          <TypePortrait hero={right.type.stack[0]} image={right.type.image} alt={right.type.code} />
          <figcaption>{compareCaption(right)}</figcaption>
        </figure>
      </div>
      <div className="workspace-seat-table">
        <div className="workspace-seat-head">
          <span />
          <span>{view.leftLabel}</span>
          <span>{view.rightLabel}</span>
        </div>
        {view.seats.map((row) => (
          <div key={row.index}>
            {row.index === 0 ? <p className="workspace-seat-ring">Ego</p> : null}
            {row.index === 4 ? <p className="workspace-seat-ring">Shadow</p> : null}
            <button
              type="button"
              className={open === row.index ? 'workspace-seat-row is-open' : 'workspace-seat-row'}
              aria-pressed={open === row.index}
              onClick={() => setOpen(row.index)}
            >
              <span className="workspace-seat-role">{row.short}</span>
              <span className="workspace-seat-fn">
                {scoreLabel(row.leftFn, row.leftPct)}
                {row.markLeft ? <small>{row.markLeft}</small> : null}
              </span>
              <span className="workspace-seat-fn">
                {scoreLabel(row.rightFn, row.rightPct)}
                {row.markRight ? <small>{row.markRight}</small> : null}
              </span>
            </button>
          </div>
        ))}
      </div>
      {seat ? (
        <div className="workspace-rail">
          <p className="workspace-rail__kicker">{seat.full}</p>
          <p>
            {view.leftName === 'you' ? 'You' : view.leftName}: {scoreLabel(seat.leftFn, seat.leftPct)}.{' '}
            {view.rightName === 'you' ? 'You' : view.rightName}: {scoreLabel(seat.rightFn, seat.rightPct)}.
          </p>
          <p>{seat.blurb}</p>
          <p>
            {FUNCTIONS[seat.leftFn].name}. {FUNCTIONS[seat.leftFn].summary}
          </p>
          {seat.rightFn !== seat.leftFn ? (
            <p>
              {FUNCTIONS[seat.rightFn].name}. {FUNCTIONS[seat.rightFn].summary}
            </p>
          ) : null}
          {open === view.inLeftIndex ? <p>{PLACE[view.reading.kind]}</p> : null}
          {open === view.inRightIndex && view.inRightIndex !== view.inLeftIndex ? (
            <p>{PLACE[view.reverse.kind]}</p>
          ) : null}
        </div>
      ) : (
        <p className="workspace-chart__hint">Tap a seat. Same row is the same seat in both.</p>
      )}
      {view.gaps.length ? (
        <p className="note">
          Where the eight differ
          {view.gaps.map((gap) => ` · ${gap.id} ${gap.left}% / ${gap.right}%`).join('')}
        </p>
      ) : null}
      <details className="stack-fold">
        <summary>The longer reading</summary>
        <p className="lede">{view.reading.detail}</p>
      </details>
    </>
  )
}
