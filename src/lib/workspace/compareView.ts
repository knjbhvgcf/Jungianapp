import { BEEBE_ROLES, beebeStack } from '../../data/beebe'
import { relationReading, type CompatKind } from '../../data/compatibility'
import { FUNCTION_IDS, type FunctionId } from '../../data/functions'
import type { PersonalityType } from '../../data/personalityTypes'
import { hasPercents } from './sharePacket'
import type { ResultSnapshot } from './types'

export type ComparePerson = {
  name: string
  type: PersonalityType
  percents?: ResultSnapshot['percents']
}

export const PLACE: Record<CompatKind, string> = {
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

function whose(name: string) {
  return name === 'you' ? 'your' : `${name}'s`
}

export function callName(person: ComparePerson) {
  if (person.name === 'Me') return 'you'
  if (person.name === person.type.title) return person.type.code
  return person.name
}

export function displayName(person: ComparePerson) {
  if (person.name === 'Me') return 'You'
  if (person.name === person.type.title) return person.type.code
  return person.name
}

export function compareCaption(person: ComparePerson) {
  const hero = person.type.stack[0]
  const score = typeof person.percents?.[hero] === 'number' ? ` · ${hero} ${person.percents[hero]}%` : ''
  if (person.name === 'Me') return `${person.type.code} · Me${score}`
  if (person.name === person.type.title) return `${person.type.code} · ${person.type.title}${score}`
  return `${person.name} · ${person.type.code}${score}`
}

export type CompareSeat = {
  index: number
  ring: 'ego' | 'shadow'
  short: string
  full: string
  blurb: string
  leftFn: FunctionId
  rightFn: FunctionId
  leftPct?: number
  rightPct?: number
  markLeft: string
  markRight: string
}

export type ScoreGap = {
  id: FunctionId
  left: number
  right: number
  delta: number
}

export function compareView(left: ComparePerson, right: ComparePerson) {
  const reading = relationReading(left.type, right.type)
  const reverse = relationReading(right.type, left.type)
  const leftSeats = beebeStack(left.type.stack)
  const rightSeats = beebeStack(right.type.stack)
  const inLeftIndex = leftSeats.indexOf(right.type.stack[0])
  const inRightIndex = rightSeats.indexOf(left.type.stack[0])
  const leftName = callName(left)
  const rightName = callName(right)
  const seats: CompareSeat[] = BEEBE_ROLES.map((role, index) => {
    const leftFn = leftSeats[index]
    const rightFn = rightSeats[index]
    return {
      index,
      ring: role.ring,
      short: SHORT[role.key] ?? role.label,
      full: role.label,
      blurb: role.blurb,
      leftFn: leftFn!,
      rightFn: rightFn!,
      leftPct: left.percents?.[leftFn],
      rightPct: right.percents?.[rightFn],
      markLeft: index === inLeftIndex ? `${whose(rightName)} Hero` : '',
      markRight: index === inRightIndex ? `${whose(leftName)} Hero` : '',
    }
  })
  const gaps: ScoreGap[] = hasPercents(left.percents) && hasPercents(right.percents)
    ? FUNCTION_IDS.map((id) => {
        const leftScore = left.percents?.[id] ?? 0
        const rightScore = right.percents?.[id] ?? 0
        return { id, left: leftScore, right: rightScore, delta: Math.abs(leftScore - rightScore) }
      })
        .filter((gap) => gap.delta >= 10)
        .sort((a, b) => b.delta - a.delta || a.id.localeCompare(b.id))
        .slice(0, 3)
    : []

  return {
    reading,
    reverse,
    leftName,
    rightName,
    leftLabel: displayName(left),
    rightLabel: displayName(right),
    inLeftIndex,
    inRightIndex,
    seats,
    gaps,
  }
}

export function scoreLabel(fn: FunctionId, percent?: number) {
  return typeof percent === 'number' ? `${fn} ${percent}%` : fn
}
