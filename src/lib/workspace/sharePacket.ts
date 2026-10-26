import { FUNCTION_IDS, type FunctionId } from '../../data/functions'
import { typeByCode } from '../../data/personalityTypes'
import { snapshotFromType } from './snapshot'
import type { ResultSnapshot } from './types'

const TYPE_RE = /\b(ENFJ|ENFP|ENTJ|ENTP|ESFJ|ESFP|ESTJ|ESTP|INFJ|INFP|INTJ|INTP|ISFJ|ISFP|ISTJ|ISTP)\b/i
const SCORE_RE = /\b(Ni|Ne|Si|Se|Ti|Te|Fi|Fe)\s*[:=]?\s*(-?\d{1,3})\s*%?/gi

export function hasPercents(percents: ResultSnapshot['percents'] | undefined) {
  if (!percents) return false
  return FUNCTION_IDS.some((id) => typeof percents[id] === 'number')
}

export function encodeShareLine(snapshot: ResultSnapshot) {
  const scores = FUNCTION_IDS.map((id) => `${id}${Math.round(snapshot.percents[id] ?? 0)}`).join(' ')
  return `jungology ${snapshot.code} ${scores}`
}

export function decodeShareText(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const typeMatch = trimmed.match(TYPE_RE)
  if (!typeMatch) return null
  const type = typeByCode(typeMatch[1])
  if (!type) return null
  const percents: ResultSnapshot['percents'] = {}
  for (const match of trimmed.matchAll(SCORE_RE)) {
    const id = match[1] as FunctionId
    const value = Number(match[2])
    if (!FUNCTION_IDS.includes(id) || !Number.isFinite(value)) continue
    percents[id] = Math.max(0, Math.min(100, Math.round(value)))
  }
  return { code: type.code, percents }
}

/** Type plus percentages from a pasted Results copy or a house share line. Never answers. */
export function snapshotFromShare(text: string): ResultSnapshot | null {
  const parsed = decodeShareText(text)
  if (!parsed || !hasPercents(parsed.percents)) return null
  const base = snapshotFromType(parsed.code)
  if (!base) return null
  return { ...base, percents: parsed.percents }
}
