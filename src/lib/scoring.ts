import { BEEBE_ROLES, beebeStack, type FunctionStack } from '../data/beebe'
import { FUNCTION_IDS, FUNCTIONS, type FunctionId } from '../data/functions'
import { PERSONALITY_TYPES, type PersonalityType } from '../data/personalityTypes'
import { QUESTIONS, type Question } from '../data/questions'

export type Answers = Record<string, number>

export type FunctionScore = {
  id: FunctionId
  raw: number
  percent: number
}

export type TypeMatch = PersonalityType & {
  fit: number
  confidence: number
  fullStack: FunctionStack
}

export type BeebePlacement = {
  position: number
  role: (typeof BEEBE_ROLES)[number]
  functionId: FunctionId
  percent: number
}

export type QuizProfile = {
  scores: FunctionScore[]
  matches: TypeMatch[]
  differentiation: number
  beebe: BeebePlacement[]
}

function scoredValue(question: Question, value: number) {
  if (question.reverse) return 6 - value
  return value
}

export function scoreFunctions(
  answers: Answers,
  questions: Question[] = QUESTIONS,
): FunctionScore[] {
  const raw = Object.fromEntries(FUNCTION_IDS.map((id) => [id, 0])) as Record<FunctionId, number>
  const count = Object.fromEntries(FUNCTION_IDS.map((id) => [id, 0])) as Record<FunctionId, number>

  for (const question of questions) {
    const value = answers[question.id]
    if (value == null) continue
    raw[question.functionId] += scoredValue(question, value)
    count[question.functionId] += 1
  }

  return FUNCTION_IDS.map((id) => {
    const n = count[id]
    if (n === 0) return { id, raw: 0, percent: 0 }
    const minRaw = n * 1
    const span = n * 4
    return {
      id,
      raw: raw[id],
      percent: Math.round(((raw[id] - minRaw) / span) * 100),
    }
  }).sort((a, b) => b.percent - a.percent || b.raw - a.raw || a.id.localeCompare(b.id))
}

function byPercent(scores: FunctionScore[]) {
  return Object.fromEntries(scores.map((score) => [score.id, score.percent / 100])) as Record<
    FunctionId,
    number
  >
}

export function rankTypes(scores: FunctionScore[]): TypeMatch[] {
  const p = byPercent(scores)
  const first = scores[0]?.id
  const second = scores[1]?.id

  const matches = PERSONALITY_TYPES.map((type) => {
    const fullStack = beebeStack(type.stack)
    const [hero, parent, child, anima, opposing, senex, trickster, demon] = fullStack

    let fit =
      5.4 * (p[hero] ?? 0) +
      2.4 * (p[parent] ?? 0) +
      0.7 * (p[child] ?? 0) +
      0.2 * (p[anima] ?? 0) +
      0.1 * (p[opposing] ?? 0) +
      0.08 * (p[senex] ?? 0) +
      0.08 * (p[trickster] ?? 0) +
      0.04 * (p[demon] ?? 0)

    fit += 2.2 * ((p[hero] ?? 0) - (p[opposing] ?? 0))
    fit += 0.8 * ((p[parent] ?? 0) - (p[senex] ?? 0))
    fit += 0.6 * ((p[hero] ?? 0) + (p[parent] ?? 0) - (p[anima] ?? 0) - (p[demon] ?? 0))

    if (first === hero) fit += 2.6
    else if (first === parent && second === hero) fit += 0.35
    else fit -= 1.6
    if (second === parent) fit += 0.45
    if (first === anima || first === demon) fit -= 1.1

    return { ...type, fit, confidence: 0, fullStack }
  }).sort((a, b) => b.fit - a.fit || a.code.localeCompare(b.code))

  const best = matches[0]?.fit ?? 0
  const next = matches[1]?.fit ?? best
  const worst = matches[matches.length - 1]?.fit ?? 0
  const spread = Math.max(best - worst, 0.35)
  const gap = (best - next) / spread
  const clarity = differentiationIndex(scores) / 100

  return matches.map((match, index) => {
    const relative = (match.fit - worst) / spread
    const confidence =
      index === 0
        ? Math.round(Math.min(96, Math.max(12, 38 * gap + 42 * relative + 20 * clarity)))
        : Math.round(Math.min(88, Math.max(8, 100 * relative)))
    return { ...match, confidence }
  })
}

export function differentiationIndex(scores: FunctionScore[]) {
  const percents = scores.map((score) => score.percent)
  const max = Math.max(...percents)
  const min = Math.min(...percents)
  return Math.round(Math.min(100, Math.max(0, max - min)))
}

export function beebePlacements(type: TypeMatch, scores: FunctionScore[]): BeebePlacement[] {
  const percentById = Object.fromEntries(scores.map((score) => [score.id, score.percent])) as Record<
    FunctionId,
    number
  >

  return type.fullStack.flatMap((functionId, index) => {
    const role = BEEBE_ROLES[index]
    if (!role) return []
    return [
      {
        position: index + 1,
        role,
        functionId,
        percent: percentById[functionId] ?? 0,
      },
    ]
  })
}

export function buildProfile(answers: Answers): QuizProfile {
  const scores = scoreFunctions(answers)
  const matches = rankTypes(scores)
  const top = matches[0]
  const beebe = top ? beebePlacements(top, scores) : []

  return {
    scores,
    matches,
    differentiation: differentiationIndex(scores),
    beebe,
  }
}

export function isFunctionId(value: string): value is FunctionId {
  return (FUNCTION_IDS as string[]).includes(value)
}

export function closeLeaders(scores: FunctionScore[], margin = 12): FunctionId[] {
  const top = scores[0]
  if (!top) return []
  const close = scores.filter((score) => top.percent - score.percent <= margin).map((score) => score.id)
  if (close.length >= 2) return close
  return scores.slice(0, 2).map((score) => score.id)
}

export function validParentsForHero(hero: FunctionId): FunctionId[] {
  return PERSONALITY_TYPES.filter((type) => type.stack[0] === hero).map((type) => type.stack[1])
}

export function validChildrenForHero(hero: FunctionId): FunctionId[] {
  return PERSONALITY_TYPES.filter((type) => type.stack[0] === hero).map((type) => type.stack[2])
}

export function validAnimasForHero(hero: FunctionId): FunctionId[] {
  return [...new Set(PERSONALITY_TYPES.filter((type) => type.stack[0] === hero).map((type) => type.stack[3]))]
}

export function parentForHeroChild(hero: FunctionId, child: FunctionId): FunctionId | undefined {
  return PERSONALITY_TYPES.find((type) => type.stack[0] === hero && type.stack[2] === child)?.stack[1]
}

export function parentForHeroAnima(hero: FunctionId, anima: FunctionId): FunctionId | undefined {
  return PERSONALITY_TYPES.find((type) => type.stack[0] === hero && type.stack[3] === anima)?.stack[1]
}

export function preferredParent(hero: FunctionId, scores: FunctionScore[]): FunctionId {
  const parents = validParentsForHero(hero)
  const ranked = [...scores].filter((score) => parents.includes(score.id))
  return ranked[0]?.id ?? parents[0] ?? hero
}

export function matchForSpine(
  matches: TypeMatch[],
  hero: FunctionId,
  parent: FunctionId,
): TypeMatch | undefined {
  return matches.find((match) => match.stack[0] === hero && match.stack[1] === parent)
}

export function leadingFunction(scores: FunctionScore[]) {
  const top = scores[0]
  if (!top) return FUNCTIONS.Ni
  return FUNCTIONS[top.id]
}

export function isQuizComplete(answers: Answers, questions: Question[] = QUESTIONS) {
  return questions.every((question) => {
    const value = answers[question.id]
    return Number.isInteger(value) && value >= 1 && value <= 5
  })
}
