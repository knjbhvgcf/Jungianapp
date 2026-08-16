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
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadAnswers(): Answers {
  if (!canUseStorage()) return {}
  try {
    const raw = sessionStorage.getItem(ANSWERS_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Answers
  } catch {
    return {}
  }
}

export function saveAnswers(answers: Answers) {
  if (!canUseStorage()) return
  sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers))
}

export function loadStackChoice(): StackChoice | null {
  if (!canUseStorage()) return null
  try {
    const raw = sessionStorage.getItem(STACK_KEY)
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
  if (!canUseStorage()) return
  sessionStorage.setItem(STACK_KEY, JSON.stringify(choice))
}

export function loadClarifyAnswers(): ClarifyAnswers {
  if (!canUseStorage()) return {}
  try {
    const raw = sessionStorage.getItem(CLARIFY_KEY)
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
  if (!canUseStorage()) return
  sessionStorage.setItem(CLARIFY_KEY, JSON.stringify(answers))
}

export function clearClarifyAnswers() {
  if (!canUseStorage()) return
  sessionStorage.removeItem(CLARIFY_KEY)
}

export function clearAnswers() {
  if (!canUseStorage()) return
  sessionStorage.removeItem(ANSWERS_KEY)
  sessionStorage.removeItem(COMPLETED_KEY)
  sessionStorage.removeItem(STACK_KEY)
  sessionStorage.removeItem(CLARIFY_KEY)
}

export function markCompleted() {
  if (!canUseStorage()) return
  sessionStorage.setItem(COMPLETED_KEY, new Date().toISOString())
}

export function hasCompletedQuiz() {
  if (!canUseStorage()) return false
  return Boolean(sessionStorage.getItem(COMPLETED_KEY))
}
