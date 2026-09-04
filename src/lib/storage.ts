import type { FunctionId } from '../data/functions'
import type { ClarifyAnswers } from './clarify'
import { isFunctionId, type Answers } from './scoring'

const ANSWERS_KEY = 'jung-functions.answers.v2'
const COMPLETED_KEY = 'jung-functions.completed.v2'
const STACK_KEY = 'jung-functions.stack-choice.v2'
const CLARIFY_KEY = 'jung-functions.clarify.v1'

export type StackChoice = {
  hero: FunctionId
  parent: FunctionId
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readItem(key: string): string | null {
  if (!canUseStorage()) return null
  try {
    const local = window.localStorage.getItem(key)
    if (local != null) return local
    const session = window.sessionStorage.getItem(key)
    if (session != null) {
      window.localStorage.setItem(key, session)
      return session
    }
    return null
  } catch {
    return null
  }
}

function writeItem(key: string, value: string) {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, value)
    window.sessionStorage.setItem(key, value)
  } catch {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* private mode */
    }
  }
}

function removeItem(key: string) {
  if (!canUseStorage()) return
  try {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function loadAnswers(): Answers {
  try {
    const raw = readItem(ANSWERS_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Answers
  } catch {
    return {}
  }
}

export function saveAnswers(answers: Answers) {
  writeItem(ANSWERS_KEY, JSON.stringify(answers))
}

export function loadStackChoice(): StackChoice | null {
  try {
    const raw = readItem(STACK_KEY)
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

export function saveStackChoice(choice: StackChoice) {
  writeItem(STACK_KEY, JSON.stringify(choice))
}

export function loadClarifyAnswers(): ClarifyAnswers {
  try {
    const raw = readItem(CLARIFY_KEY)
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

export function saveClarifyAnswers(answers: ClarifyAnswers) {
  writeItem(CLARIFY_KEY, JSON.stringify(answers))
}

export function clearClarifyAnswers() {
  removeItem(CLARIFY_KEY)
}

export function clearAnswers() {
  removeItem(ANSWERS_KEY)
  removeItem(COMPLETED_KEY)
  removeItem(STACK_KEY)
  removeItem(CLARIFY_KEY)
}

export function markCompleted() {
  writeItem(COMPLETED_KEY, new Date().toISOString())
}

export function hasCompletedQuiz() {
  return Boolean(readItem(COMPLETED_KEY))
}

/** Copy any leftover session-only quiz into localStorage so checkout return tabs can see it. */
export function migrateQuizStorage() {
  readItem(ANSWERS_KEY)
  readItem(STACK_KEY)
  readItem(CLARIFY_KEY)
  readItem(COMPLETED_KEY)
}
