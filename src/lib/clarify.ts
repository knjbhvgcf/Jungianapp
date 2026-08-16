import { FUNCTION_IDS, FUNCTIONS, type FunctionId } from '../data/functions'
import { clarifyQuestionsFor, clarifyQuestionsForPairs } from '../data/clarifyQuestions'
import { isHeroPhaseComplete } from '../data/questions'
import {
  beebePlacements,
  differentiationIndex,
  isQuizComplete,
  rankTypes,
  scoreFunctions,
  type Answers,
  type FunctionScore,
  type QuizProfile,
} from './scoring'
import { closePairs, type ClosePair, type TieBreakReading } from './tieBreak'

const MIN_RAW = 6
const MAX_RAW = 30
const POINT_PER_NET_VOTE = 3

export type ClarifyAnswers = Record<string, FunctionId>

export type FollowUpResult = {
  pair: ClosePair
  aVotes: number
  bVotes: number
  winner: FunctionId
  loser: FunctionId
  stillTied: boolean
  confidence: number
  summary: string
}

export function followUpForPair(pair: ClosePair, clarify: ClarifyAnswers): FollowUpResult | null {
  const questions = clarifyQuestionsFor(pair)
  const votes = questions
    .map((question) => clarify[question.id])
    .filter((value): value is FunctionId => value === pair.a || value === pair.b)

  if (votes.length < questions.length) return null

  const aVotes = votes.filter((value) => value === pair.a).length
  const bVotes = votes.filter((value) => value === pair.b).length
  const winner = aVotes >= bVotes ? pair.a : pair.b
  const loser = winner === pair.a ? pair.b : pair.a
  const gap = Math.abs(aVotes - bVotes)
  const stillTied = gap === 0
  const confidence = Math.round((Math.max(aVotes, bVotes) / votes.length) * 100)

  const summary = stillTied
    ? `${pair.a} and ${pair.b} stayed even on the follow-up questions, so the extra items still cannot honestly name a single leading function.`
    : `The follow-up asked you to choose between ${pair.a} and ${pair.b}, rather than rate them again, and you chose ${FUNCTIONS[winner].id} on ${Math.max(aVotes, bVotes)} of ${votes.length} items (${FUNCTIONS[loser].id} on ${Math.min(aVotes, bVotes)}), which makes that the leading function.`

  return {
    pair,
    aVotes,
    bVotes,
    winner,
    loser,
    stillTied,
    confidence,
    summary,
  }
}

function clampPercent(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)))
}

function rawFromPercent(percent: number) {
  return MIN_RAW + (percent / 100) * (MAX_RAW - MIN_RAW)
}

export function scoresAfterFollowUp(
  scores: FunctionScore[],
  clarify: ClarifyAnswers,
): FunctionScore[] {
  const next = new Map(scores.map((score) => [score.id, { ...score }]))
  let changed = false

  for (const pair of closePairs(scores)) {
    const followUp = followUpForPair(pair, clarify)
    if (!followUp || followUp.stillTied) continue
    const winner = next.get(followUp.winner)
    const loser = next.get(followUp.loser)
    if (!winner || !loser) continue
    const delta = Math.abs(followUp.aVotes - followUp.bVotes) * POINT_PER_NET_VOTE
    winner.percent = clampPercent(winner.percent + delta)
    loser.percent = clampPercent(loser.percent - delta)
    winner.raw = rawFromPercent(winner.percent)
    loser.raw = rawFromPercent(loser.percent)
    changed = true
  }

  if (!changed) return scores
  return FUNCTION_IDS.map((id) => next.get(id)).filter((score): score is FunctionScore => Boolean(score))
    .sort((left, right) => right.percent - left.percent || left.id.localeCompare(right.id))
}

export function applyFollowUpToProfile(
  profile: QuizProfile,
  clarify: ClarifyAnswers,
): QuizProfile {
  const scores = scoresAfterFollowUp(profile.scores, clarify)
  if (scores === profile.scores) return profile
  const matches = rankTypes(scores)
  const top = matches[0]
  return {
    scores,
    matches,
    differentiation: differentiationIndex(scores),
    beebe: top ? beebePlacements(top, scores) : [],
  }
}

export function applyFollowUp(
  reading: TieBreakReading,
  clarify: ClarifyAnswers,
  scores?: FunctionScore[],
): TieBreakReading {
  const followUp = followUpForPair(reading.pair, clarify)
  const aPercent = scores?.find((score) => score.id === reading.pair.a)?.percent ?? reading.aPercent
  const bPercent = scores?.find((score) => score.id === reading.pair.b)?.percent ?? reading.bPercent
  if (!followUp) {
    return { ...reading, aPercent, bPercent, margin: Math.abs(aPercent - bPercent) }
  }

  return {
    ...reading,
    aPercent,
    bPercent,
    margin: Math.abs(aPercent - bPercent),
    winner: followUp.winner,
    loser: followUp.loser,
    stillTied: followUp.stillTied,
    confidence: followUp.stillTied ? reading.confidence : Math.max(reading.confidence, followUp.confidence),
    summary: followUp.summary,
    signals: [
      {
        label: 'Follow-up questions',
        lean: followUp.winner,
        weight: 8,
        detail: followUp.summary,
      },
      ...reading.signals,
    ],
  }
}

export function pairsNeedingFollowUp(
  quizAnswers: Answers,
  mode: 'auto' | 'hero' | 'all' = 'auto',
): ClosePair[] {
  const complete = isQuizComplete(quizAnswers)
  const heroReady = isHeroPhaseComplete(quizAnswers)
  const scores = scoreFunctions(quizAnswers)
  const heroOnly = mode === 'hero' || (mode === 'auto' && !complete && heroReady)

  if (heroOnly) {
    if (!heroReady) return []
    const top = new Set(scores.slice(0, 2).map((score) => score.id))
    return closePairs(scores).filter((pair) => top.has(pair.a) || top.has(pair.b))
  }

  if (!complete) return []
  return closePairs(scores)
}

export function followUpQuestions(quizAnswers: Answers) {
  return clarifyQuestionsForPairs(pairsNeedingFollowUp(quizAnswers))
}

export function isFollowUpComplete(quizAnswers: Answers, clarify: ClarifyAnswers): boolean {
  const questions = followUpQuestions(quizAnswers)
  if (!questions.length) return true
  return questions.every((question) => {
    const value = clarify[question.id]
    return value === question.a || value === question.b
  })
}

export function needsFollowUp(quizAnswers: Answers, clarify: ClarifyAnswers): boolean {
  return pairsNeedingFollowUp(quizAnswers).length > 0 && !isFollowUpComplete(quizAnswers, clarify)
}
