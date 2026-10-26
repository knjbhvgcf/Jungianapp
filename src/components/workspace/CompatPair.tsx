import { useState } from 'react'
import { BEEBE_ROLES, beebeStack } from '../../data/beebe'
import { relationReading, type CompatKind } from '../../data/compatibility'
import { FUNCTIONS } from '../../data/functions'
import type { PersonalityType } from '../../data/personalityTypes'
import type { ResultSnapshot } from '../../lib/workspace/types'
import { hasPercents } from '../../lib/workspace/sharePacket'
import { TypePortrait } from '../TypePortrait'
import { EightChart } from './EightChart'
import { PercentBars } from './PercentBars'

const PLACE: Record<CompatKind, string> = {
  same: 'You will not have to translate. The risk is collusion — two of you postponing the same weak function.',
  sister: 'You recognise the drive at once and argue about how people ought to be looked after.',
  mirror: 'Each of you lives as identity what the other uses to foster. Respect, and a quiet fight over who decides.',
  parent: 'They sound like competence in the function by which you look after the world. Relief, or a lecture.',
  child: 'Play is easy. Being taken equally seriously is not.',
  anima: 'Fascination and irritation travel together. You may want them to carry this function for you.',
  opposing: 'Arguments that sound like you turned the other way. Same function, opposite attitude.',
  senex: 'You may hear a critic where they hear a standard.',
  trickster: 'Humour, loopholes, and binds. What feels like play can also be an escape neither of you named.',
  demon: 'Uncanny heat. They are fluent in what you almost never meet as a skill in yourself.',
}

function seatName(person: { name: string; type: PersonalityType }) {
  if (person.name === 'Me') return 'you'
  if (person.name === person.type.title) return person.type.code
  return person.name
}

function whose(name: string) {
  return name === 'you' ? 'your' : `${name}'s`
}

function scoreOf(percents: ResultSnapshot['percents'] | undefined, id: string) {
  const value = percents?.[id as keyof ResultSnapshot['percents']]
  return typeof value === 'number' ? ` ${value}%` : ''
}

function captionFor(person: {
  name: string
  type: PersonalityType
  percents?: ResultSnapshot['percents']
}) {
  const hero = person.type.stack[0]
  const score = scoreOf(person.percents, hero)
  if (person.name === 'Me' || person.name === person.type.title) {
    return `${person.type.code} · ${person.name === 'Me' ? 'Me' : person.type.title}${score ? ` · ${hero}${score}` : ''}`
  }
  return `${person.name} · ${person.type.code}${score ? ` · ${hero}${score}` : ''}`
}

export function CompatPair({
  left,
  right,
}: {
  left: { name: string; type: PersonalityType; percents?: ResultSnapshot['percents'] }
  right: { name: string; type: PersonalityType; percents?: ResultSnapshot['percents'] }
}) {
  const [open, setOpen] = useState<number | null>(null)
  const reading = relationReading(left.type, right.type)
  const reverse = relationReading(right.type, left.type)
  const leftSeats = beebeStack(left.type.stack)
  const rightSeats = beebeStack(right.type.stack)
  const inLeftIndex = leftSeats.indexOf(right.type.stack[0])
  const inRightIndex = rightSeats.indexOf(left.type.stack[0])
  const inLeft = inLeftIndex >= 0 ? BEEBE_ROLES[inLeftIndex] : null
  const inRight = inRightIndex >= 0 ? BEEBE_ROLES[inRightIndex] : null
  const leftName = seatName(left)
  const rightName = seatName(right)
  const role = open != null ? BEEBE_ROLES[open] : null
  const leftFn = open != null ? leftSeats[open] : null
  const rightFn = open != null ? rightSeats[open] : null

  function pick(index: number) {
    setOpen((current) => (current === index ? null : index))
  }

  return (
    <>
      {inLeft ? (
        <p className="lede">
          {rightName === 'you' ? 'You' : rightName} lead{rightName === 'you' ? '' : 's'} with{' '}
          {right.type.stack[0]}. In {leftName} that is {inLeft.label}.
          {inRight ? (
            <>
              {' '}
              {leftName === 'you' ? 'You' : leftName} lead{leftName === 'you' ? '' : 's'} with {left.type.stack[0]}.
              In {rightName} that is {inRight.label}.
            </>
          ) : null}
        </p>
      ) : null}
      <p className="mono-stat">
        {reading.label}
        {reading.charge ? ` · ${reading.charge}` : ''}
      </p>
      <p className="lede">{reading.note}</p>
      <div className="workspace-compat-cols">
        <div>
          <figure>
            <TypePortrait hero={left.type.stack[0]} image={left.type.image} alt={left.type.code} />
            <figcaption>{captionFor(left)}</figcaption>
          </figure>
          {inLeftIndex >= 0 ? (
            <EightChart
              layout="stack"
              quiet
              stack={left.type.stack}
              percents={left.percents}
              marks={[{ index: inLeftIndex, label: `${whose(rightName)} Hero` }]}
              selected={open}
              onSelect={pick}
            />
          ) : null}
          {hasPercents(left.percents) && hasPercents(right.percents) ? (
            <PercentBars percents={left.percents} caption="" />
          ) : null}
        </div>
        <div>
          <figure>
            <TypePortrait hero={right.type.stack[0]} image={right.type.image} alt={right.type.code} />
            <figcaption>{captionFor(right)}</figcaption>
          </figure>
          {inRightIndex >= 0 ? (
            <EightChart
              layout="stack"
              quiet
              stack={right.type.stack}
              percents={right.percents}
              marks={[{ index: inRightIndex, label: `${whose(leftName)} Hero` }]}
              selected={open}
              onSelect={pick}
            />
          ) : null}
          {hasPercents(left.percents) && hasPercents(right.percents) ? (
            <PercentBars percents={right.percents} caption="" />
          ) : null}
        </div>
      </div>
      {role && leftFn && rightFn ? (
        <div className="workspace-rail">
          <p className="workspace-rail__kicker">{role.label}</p>
          <p>
            {leftName === 'you' ? 'You' : leftName}: {leftFn}
            {scoreOf(left.percents, leftFn)}. {rightName === 'you' ? 'You' : rightName}: {rightFn}
            {scoreOf(right.percents, rightFn)}.
          </p>
          <p>{role.blurb}</p>
          <p>
            {FUNCTIONS[leftFn].name}. {FUNCTIONS[leftFn].summary}
          </p>
          {rightFn !== leftFn ? (
            <p>
              {FUNCTIONS[rightFn].name}. {FUNCTIONS[rightFn].summary}
            </p>
          ) : null}
          {open === inLeftIndex ? <p>{PLACE[reading.kind]}</p> : null}
          {open === inRightIndex && inRightIndex !== inLeftIndex ? <p>{PLACE[reverse.kind]}</p> : null}
        </div>
      ) : (
        <p className="workspace-chart__hint">Tap a seat. Same row is the same seat in both.</p>
      )}
    </>
  )
}
