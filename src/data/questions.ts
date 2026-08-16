import bank from '../content/questions.json'
import type { FunctionId } from './functions'

export type QuestionFacet = 'orientation' | 'process' | 'criterion' | 'reverse'

export type Question = {
  id: string
  text: string
  functionId: FunctionId
  facet: QuestionFacet
  reverse?: boolean
}

type ItemDraft = Omit<Question, 'id'>

const BANK = bank as Record<FunctionId, ItemDraft[]>

const ROUND_ORDER: FunctionId[] = ['Ni', 'Se', 'Fi', 'Te', 'Ne', 'Si', 'Fe', 'Ti']
const FACET_ORDER: QuestionFacet[] = ['orientation', 'criterion', 'process', 'reverse']

export const QUESTIONS_PER_FUNCTION = 6
export const HERO_PHASE_FACETS: QuestionFacet[] = ['orientation', 'criterion']

function itemsForFacet(facet: QuestionFacet): Question[] {
  const byFunction = Object.fromEntries(
    ROUND_ORDER.map((functionId) => [
      functionId,
      BANK[functionId]
        .map((item, bankIndex) => ({
          ...item,
          id: `q-${functionId}-${bankIndex + 1}`,
        }))
        .filter((item) => item.facet === facet),
    ]),
  ) as Record<FunctionId, Question[]>

  const depth = Math.max(...ROUND_ORDER.map((functionId) => byFunction[functionId].length), 0)
  return Array.from({ length: depth }, (_, round) =>
    ROUND_ORDER.flatMap((functionId) => {
      const item = byFunction[functionId][round]
      return item ? [item] : []
    }),
  ).flat()
}

export const QUESTIONS: Question[] = FACET_ORDER.flatMap((facet) => itemsForFacet(facet))

export function isHeroPhaseQuestion(question: Question) {
  return HERO_PHASE_FACETS.includes(question.facet)
}

export const HERO_PHASE_QUESTIONS = QUESTIONS.filter(isHeroPhaseQuestion)

export function isHeroPhaseComplete(answers: Record<string, number>) {
  return HERO_PHASE_QUESTIONS.every((question) => {
    const value = answers[question.id]
    return Number.isInteger(value) && value >= 1 && value <= 5
  })
}

export const LIKERT_LABELS = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
] as const
