import followup from '../content/followup.json'
import { FUNCTIONS, type FunctionId } from './functions'
import { FUNCTION_PORTRAITS } from './functionPortraits'

export type ClarifyPair = {
  key: string
  label: string
  a: FunctionId
  b: FunctionId
}

export type ClarifyQuestion = {
  id: string
  pairKey: string
  label: string
  a: FunctionId
  b: FunctionId
  prompt: string
  aText: string
  bText: string
}

type ClarifyDraft = {
  prompt: string
  aText: string
  bText: string
}

const ATTITUDE_BANK = followup.attitude as Record<string, ClarifyDraft[]>
const RIVAL_BANK = followup.rival as Record<string, ClarifyDraft[]>

function draftsFor(pair: ClarifyPair): ClarifyDraft[] {
  const fromBank = ATTITUDE_BANK[pair.key] ?? RIVAL_BANK[pair.key]
  if (fromBank) return fromBank

  const fa = FUNCTIONS[pair.a]
  const fb = FUNCTIONS[pair.b]
  const pa = FUNCTION_PORTRAITS[pair.a]
  const pb = FUNCTION_PORTRAITS[pair.b]
  return [
    {
      prompt: 'Which is more you, day to day?',
      aText: fa.summary,
      bText: fb.summary,
    },
    {
      prompt: 'When you have to decide, which question do you actually ask?',
      aText: pa.asks[0] ?? fa.role,
      bText: pb.asks[0] ?? fb.role,
    },
    {
      prompt: 'What are you more concerned with?',
      aText: pa.concerns.slice(0, 3).join(', '),
      bText: pb.concerns.slice(0, 3).join(', '),
    },
    {
      prompt: 'Which work feels like yours?',
      aText: fa.description.split('.')[0] + '.',
      bText: fb.description.split('.')[0] + '.',
    },
    {
      prompt: 'If you can lead with only one, which do you keep?',
      aText: `${fa.id} — ${fa.role}.`,
      bText: `${fb.id} — ${fb.role}.`,
    },
  ]
}

export function clarifyQuestionsFor(pair: ClarifyPair): ClarifyQuestion[] {
  return draftsFor(pair).map((item, index) => ({
    ...item,
    pairKey: pair.key,
    label: pair.label,
    a: pair.a,
    b: pair.b,
    id: `c-${pair.key}-${String(index + 1).padStart(2, '0')}`,
  }))
}

export function clarifyQuestionsForPairs(pairs: ClarifyPair[]): ClarifyQuestion[] {
  return pairs.flatMap((pair) => clarifyQuestionsFor(pair))
}
