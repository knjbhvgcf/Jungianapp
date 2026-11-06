import AsyncStorage from '@react-native-async-storage/async-storage'
import { isFunctionId, type Answers } from '../../src/lib/scoring'
import type { ClarifyAnswers } from '../../src/lib/clarify'
import type { FunctionId } from '../../src/data/functions'

const ANSWERS_KEY = 'jung-functions.answers.v2'
const COMPLETED_KEY = 'jung-functions.completed.v2'
const STACK_KEY = 'jung-functions.stack-choice.v2'
const CLARIFY_KEY = 'jung-functions.clarify.v1'

export type StackChoice = {
  hero: FunctionId
  parent: FunctionId
}

async function readItem(key: string) {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return null
  }
}

async function writeItem(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value)
  } catch {
    /* private mode / full disk */
  }
}

async function removeItem(key: string) {
  try {
    await AsyncStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export async function loadAnswers(): Promise<Answers> {
  try {
    const raw = await readItem(ANSWERS_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Answers
  } catch {
    return {}
  }
}

export async function saveAnswers(answers: Answers) {
  await writeItem(ANSWERS_KEY, JSON.stringify(answers))
}

export async function loadClarifyAnswers(): Promise<ClarifyAnswers> {
  try {
    const raw = await readItem(CLARIFY_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    const next: ClarifyAnswers = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && isFunctionId(value)) next[id] = value
    }
    return next
  } catch {
    return {}
  }
}

export async function saveClarifyAnswers(answers: ClarifyAnswers) {
  await writeItem(CLARIFY_KEY, JSON.stringify(answers))
}

export async function loadStackChoice(): Promise<StackChoice | null> {
  try {
    const raw = await readItem(STACK_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const hero = 'hero' in parsed ? parsed.hero : null
    const parent = 'parent' in parsed ? parsed.parent : null
    if (typeof hero !== 'string' || typeof parent !== 'string') return null
    if (!isFunctionId(hero) || !isFunctionId(parent)) return null
    return { hero, parent }
  } catch {
    return null
  }
}

export async function saveStackChoice(choice: StackChoice) {
  await writeItem(STACK_KEY, JSON.stringify(choice))
}

export async function markCompleted() {
  await writeItem(COMPLETED_KEY, new Date().toISOString())
}

export async function clearQuiz() {
  await Promise.all([
    removeItem(ANSWERS_KEY),
    removeItem(COMPLETED_KEY),
    removeItem(STACK_KEY),
    removeItem(CLARIFY_KEY),
  ])
}
