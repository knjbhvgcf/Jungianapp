import { FUNCTIONS, type FunctionId } from '../data/functions'
import { QUESTIONS, type Question, type QuestionFacet } from '../data/questions'
import { type Answers, type FunctionScore } from './scoring'

export type ClosePairKind = 'attitude' | 'rival'

export type ClosePair = {
  key: string
  kind: ClosePairKind
  a: FunctionId
  b: FunctionId
  label: string
}

export const ATTITUDE_PAIRS: ClosePair[] = [
  { key: 'Ni-Ne', kind: 'attitude', a: 'Ni', b: 'Ne', label: 'intuition' },
  { key: 'Si-Se', kind: 'attitude', a: 'Si', b: 'Se', label: 'sensation' },
  { key: 'Ti-Te', kind: 'attitude', a: 'Ti', b: 'Te', label: 'thinking' },
  { key: 'Fi-Fe', kind: 'attitude', a: 'Fi', b: 'Fe', label: 'feeling' },
]

export const RIVAL_PAIRS: ClosePair[] = [
  { key: 'Fi-Ti', kind: 'rival', a: 'Fi', b: 'Ti', label: 'introverted judging' },
  { key: 'Fe-Te', kind: 'rival', a: 'Fe', b: 'Te', label: 'extraverted judging' },
  { key: 'Ni-Si', kind: 'rival', a: 'Ni', b: 'Si', label: 'introverted perceiving' },
  { key: 'Ne-Se', kind: 'rival', a: 'Ne', b: 'Se', label: 'extraverted perceiving' },
]

export function pairKey(left: FunctionId, right: FunctionId) {
  return [left, right].sort().join('-')
}

export function pairFromIds(left: FunctionId, right: FunctionId): ClosePair {
  const key = pairKey(left, right)
  const known = [...ATTITUDE_PAIRS, ...RIVAL_PAIRS].find((pair) => pair.key === key)
  if (known) return known
  return {
    key,
    kind: 'rival',
    a: left,
    b: right,
    label: 'leading functions',
  }
}

export type TieSignal = {
  label: string
  lean: FunctionId
  weight: number
  detail: string
}

export type TieBreakReading = {
  pair: ClosePair
  aPercent: number
  bPercent: number
  margin: number
  winner: FunctionId
  loser: FunctionId
  confidence: number
  stillTied: boolean
  signals: TieSignal[]
  summary: string
}

const CLOSE_MARGIN = 10
const STRONG_FLOOR = 58

function scoredItem(question: Question, answers: Answers) {
  const raw = answers[question.id]
  if (raw == null) return null
  return question.reverse ? 6 - raw : raw
}

function itemsFor(functionId: FunctionId) {
  return QUESTIONS.filter((question) => question.functionId === functionId)
}

function facetMean(functionId: FunctionId, facet: QuestionFacet, answers: Answers) {
  const items = itemsFor(functionId).filter((question) => question.facet === facet)
  const values = items
    .map((question) => scoredItem(question, answers))
    .filter((value): value is number => value != null)
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function allMeans(functionId: FunctionId, answers: Answers) {
  const values = itemsFor(functionId)
    .map((question) => scoredItem(question, answers))
    .filter((value): value is number => value != null)
  if (!values.length) return { mean: 0, peak: 0, lows: 0, spread: 0, fives: 0 }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const peak = Math.max(...values)
  const lows = values.filter((value) => value <= 2).length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return {
    mean,
    peak,
    lows,
    spread: Math.sqrt(variance),
    fives: values.filter((value) => value >= 5).length,
  }
}

function percentOf(scores: FunctionScore[], id: FunctionId) {
  return scores.find((score) => score.id === id)?.percent ?? 0
}

function structuralLean(pair: ClosePair, scores: FunctionScore[]): { lean: FunctionId; gap: number } {
  const p = Object.fromEntries(scores.map((score) => [score.id, score.percent])) as Record<
    FunctionId,
    number
  >
  if (pair.kind === 'attitude') {
    const introvertedPerceiving = pair.a === 'Ni' || pair.a === 'Si'
    const extraSupport = introvertedPerceiving ? (p.Te ?? 0) + (p.Fe ?? 0) : (p.Ne ?? 0) + (p.Se ?? 0)
    const introSupport = introvertedPerceiving ? (p.Ti ?? 0) + (p.Fi ?? 0) : (p.Ni ?? 0) + (p.Si ?? 0)
    const gap = extraSupport - introSupport
    return {
      lean: gap >= 0 ? pair.a : pair.b,
      gap: Math.abs(gap),
    }
  }
  if (pair.key === 'Fi-Ti') {
    const gap = (p.Te ?? 0) - (p.Fe ?? 0)
    return { lean: gap >= 0 ? 'Fi' : 'Ti', gap: Math.abs(gap) }
  }
  if (pair.key === 'Fe-Te') {
    const gap = (p.Si ?? 0) + (p.Ni ?? 0) - ((p.Se ?? 0) + (p.Ne ?? 0))
    return { lean: gap >= 0 ? 'Te' : 'Fe', gap: Math.abs(gap) }
  }
  if (pair.key === 'Ni-Si') {
    const gap = (p.Se ?? 0) - (p.Ne ?? 0)
    return { lean: gap >= 0 ? 'Ni' : 'Si', gap: Math.abs(gap) }
  }
  if (pair.key === 'Ne-Se') {
    const gap = (p.Ti ?? 0) + (p.Fi ?? 0) - ((p.Te ?? 0) + (p.Fe ?? 0))
    return { lean: gap >= 0 ? 'Ne' : 'Se', gap: Math.abs(gap) }
  }
  const aParent = Math.max(p[pair.a] ?? 0)
  const bParent = Math.max(p[pair.b] ?? 0)
  return { lean: aParent >= bParent ? pair.a : pair.b, gap: Math.abs(aParent - bParent) }
}

function pairCopy(pair: ClosePair) {
  if (pair.key === 'Ni-Ne') {
    return {
      name: pair.label,
      a: 'introverted intuition (the inner image, one trajectory)',
      b: 'extraverted intuition (the field of outer possibilities)',
    }
  }
  if (pair.key === 'Si-Se') {
    return {
      name: pair.label,
      a: 'introverted sensation (the impression stored in memory and body)',
      b: 'extraverted sensation (the object as it is now)',
    }
  }
  if (pair.key === 'Ti-Te') {
    return {
      name: pair.label,
      a: 'introverted thinking (the idea that must be consistent)',
      b: 'extraverted thinking (the order that works in common)',
    }
  }
  if (pair.key === 'Fi-Fe') {
    return {
      name: pair.label,
      a: 'introverted feeling (the private standard of worth)',
      b: 'extraverted feeling (the feeling-tone of the people involved)',
    }
  }
  if (pair.key === 'Fi-Ti') {
    return {
      name: pair.label,
      a: 'introverted feeling (what is right, even if it cannot be proved)',
      b: 'introverted thinking (what is true, even if it is not kind)',
    }
  }
  if (pair.key === 'Fe-Te') {
    return {
      name: pair.label,
      a: 'extraverted feeling (whether the people involved can still stand together)',
      b: 'extraverted thinking (whether the result can be arranged and checked)',
    }
  }
  if (pair.key === 'Ni-Si') {
    return {
      name: pair.label,
      a: 'introverted intuition (the inner image of where this is tending)',
      b: 'introverted sensation (the impression already stored in memory and body)',
    }
  }
  if (pair.key === 'Ne-Se') {
    return {
      name: pair.label,
      a: 'extraverted intuition (what the situation could become)',
      b: 'extraverted sensation (what the situation is now)',
    }
  }
  return {
    name: pair.label,
    a: FUNCTIONS[pair.a].name,
    b: FUNCTIONS[pair.b].name,
  }
}

function analyzePair(pair: ClosePair, answers: Answers, scores: FunctionScore[]): TieBreakReading {
  const intro = pair.a
  const extra = pair.b
  const introPercent = percentOf(scores, intro)
  const extraPercent = percentOf(scores, extra)
  const copy = pairCopy(pair)
  const signals: TieSignal[] = []

  const add = (
    label: string,
    introValue: number | null,
    extraValue: number | null,
    weight: number,
    whenIntro: string,
    whenExtra: string,
    whenEven: string,
  ) => {
    if (introValue == null || extraValue == null) return
    const delta = introValue - extraValue
    if (Math.abs(delta) < 0.12) {
      signals.push({ label, lean: introPercent >= extraPercent ? intro : extra, weight: 0.2, detail: whenEven })
      return
    }
    const lean = delta > 0 ? intro : extra
    signals.push({
      label,
      lean,
      weight,
      detail: delta > 0 ? whenIntro : whenExtra,
    })
  }

  add(
    'Orientation',
    facetMean(intro, 'orientation', answers),
    facetMean(extra, 'orientation', answers),
    3.2,
    `On the items that ask how ${copy.name} orients, you endorsed ${FUNCTIONS[intro].id} more: ${copy.a}.`,
    `On the items that ask how ${copy.name} orients, you endorsed ${FUNCTIONS[extra].id} more: ${copy.b}.`,
    `Orientation items were nearly even, so the raw bars alone cannot settle the pair.`,
  )

  add(
    'Process',
    facetMean(intro, 'process', answers),
    facetMean(extra, 'process', answers),
    2.1,
    `The process items — how ${copy.name} actually works in you — favored ${FUNCTIONS[intro].id}.`,
    `The process items — how ${copy.name} actually works in you — favored ${FUNCTIONS[extra].id}.`,
    `Process items did not split the pair.`,
  )

  add(
    'Criterion',
    facetMean(intro, 'criterion', answers),
    facetMean(extra, 'criterion', answers),
    1.8,
    `What you treat as a valid reason to decide lined up with ${FUNCTIONS[intro].id}.`,
    `What you treat as a valid reason to decide lined up with ${FUNCTIONS[extra].id}.`,
    `The criterion items were split.`,
  )

  add(
    'Reverse item',
    facetMean(intro, 'reverse', answers),
    facetMean(extra, 'reverse', answers),
    2.6,
    `After reverse-keying, ${FUNCTIONS[intro].id} held more firmly than ${FUNCTIONS[extra].id}.`,
    `After reverse-keying, ${FUNCTIONS[extra].id} held more firmly than ${FUNCTIONS[intro].id}.`,
    `The reverse items cancelled each other, which is common when both functions feel familiar.`,
  )

  const introStats = allMeans(intro, answers)
  const extraStats = allMeans(extra, answers)

  add(
    'Strong endorsements',
    introStats.fives + introStats.peak * 0.15,
    extraStats.fives + extraStats.peak * 0.15,
    1.4,
    `You gave ${FUNCTIONS[intro].id} more full endorsements (strongly agree, after reverse-keying). A leading function is usually the one you will not hedge.`,
    `You gave ${FUNCTIONS[extra].id} more full endorsements (strongly agree, after reverse-keying). A leading function is usually the one you will not hedge.`,
    `Peak endorsements were shared.`,
  )

  add(
    'Consistency',
    -introStats.spread - introStats.lows * 0.35,
    -extraStats.spread - extraStats.lows * 0.35,
    1.6,
    `${FUNCTIONS[intro].id} was the more even set of answers. A true lead tends to be high across items, not only on one or two that sounded like you.`,
    `${FUNCTIONS[extra].id} was the more even set of answers. A true lead tends to be high across items, not only on one or two that sounded like you.`,
    `Both sets of answers were about equally consistent.`,
  )

  const structure = structuralLean(pair, scores)
  signals.push({
    label: 'Supporting functions',
    lean: structure.lean,
    weight: structure.gap >= 8 ? 2.2 : 0.8,
    detail: `The rest of the profile — parent and anima scores — fits a ${FUNCTIONS[structure.lean].id} lead better than a ${FUNCTIONS[structure.lean === intro ? extra : intro].id} lead.`,
  })

  let introScore = 0
  let extraScore = 0
  for (const signal of signals) {
    if (signal.lean === intro) introScore += signal.weight
    else extraScore += signal.weight
  }

  const winner = introScore >= extraScore ? intro : extra
  const loser = winner === intro ? extra : intro
  const gap = Math.abs(introScore - extraScore)
  const total = introScore + extraScore || 1
  const stillTied = gap < 1.1
  const confidence = Math.round(Math.min(92, Math.max(18, (gap / total) * 100 + (stillTied ? 0 : 12))))

  const summary = stillTied
    ? `${FUNCTIONS[intro].id} and ${FUNCTIONS[extra].id} both scored ${introPercent}% and ${extraPercent}%. The first 48 items cannot honestly name a single lead for ${copy.name}. The follow-up questions are what settle it.`
    : `${FUNCTIONS[intro].id} and ${FUNCTIONS[extra].id} landed within ${Math.abs(introPercent - extraPercent)} points (${introPercent}% and ${extraPercent}%). Looking past the totals, the closer reading names ${FUNCTIONS[winner].id}. ${FUNCTIONS[loser].id} remains strong, not a second hero.`

  return {
    pair,
    aPercent: introPercent,
    bPercent: extraPercent,
    margin: Math.abs(introPercent - extraPercent),
    winner,
    loser,
    confidence,
    stillTied,
    signals: signals.filter((signal) => signal.weight >= 0.8),
    summary,
  }
}

export function isClosePair(pair: ClosePair, scores: FunctionScore[]): boolean {
  const aPercent = percentOf(scores, pair.a)
  const bPercent = percentOf(scores, pair.b)
  const high = Math.max(aPercent, bPercent)
  const margin = Math.abs(aPercent - bPercent)
  const ranked = scores.map((score) => score.id)
  const nearTop = ranked.indexOf(pair.a) <= 3 && ranked.indexOf(pair.b) <= 3
  if (margin > CLOSE_MARGIN) return false
  if (high < STRONG_FLOOR && !nearTop) return false
  return true
}

export function closePairs(scores: FunctionScore[]): ClosePair[] {
  const found = new Map<string, ClosePair>()
  for (const pair of [...ATTITUDE_PAIRS, ...RIVAL_PAIRS]) {
    if (isClosePair(pair, scores)) found.set(pair.key, pair)
  }
  const first = scores[0]
  const second = scores[1]
  if (
    first &&
    second &&
    first.percent - second.percent <= CLOSE_MARGIN &&
    first.percent >= STRONG_FLOOR
  ) {
    const pair = pairFromIds(first.id, second.id)
    found.set(pair.key, pair)
  }
  return [...found.values()]
}

export function closeAttitudeReadings(answers: Answers, scores: FunctionScore[]): TieBreakReading[] {
  return closePairs(scores)
    .map((pair) => analyzePair(pair, answers, scores))
    .sort((a, b) => a.margin - b.margin || b.confidence - a.confidence)
}

export function suggestedHeroFromTieBreak(
  readings: TieBreakReading[],
  scores: FunctionScore[],
): FunctionId | undefined {
  const top = scores[0]
  if (!top) return undefined
  const relevant = readings.find(
    (reading) =>
      !reading.stillTied &&
      reading.confidence >= 52 &&
      (reading.winner === top.id ||
        reading.loser === top.id ||
        reading.pair.a === top.id ||
        reading.pair.b === top.id),
  )
  return relevant?.winner
}
