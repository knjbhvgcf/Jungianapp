import { FUNCTION_IDS, type FunctionId } from '../../data/functions'
import { isTypeCode } from '../typeCensusShared'
import type { ResultSnapshot } from './types'

const INVITE_TTL_SEC = 30 * 24 * 60 * 60

export function inviteKvKey(token: string) {
  return `invite:${token}`
}

export function newInviteToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}${Math.random().toString(16).slice(2, 14)}`
}

export function parseInviteToken(raw: string | null | undefined) {
  const token = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  if (token.length < 8 || token.length > 64) return null
  return token
}

export function inviteQuizHref(origin: string, token: string) {
  const base = origin.replace(/\/$/, '')
  return `${base}/quiz?invite=${token}`
}

function asFunctionId(value: unknown): FunctionId | null {
  return typeof value === 'string' && FUNCTION_IDS.includes(value as FunctionId) ? (value as FunctionId) : null
}

/** Type plus eight percentages. Never answers. */
export function snapshotOnly(value: unknown): ResultSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const code = String(raw.code ?? '').trim().toUpperCase()
  if (!isTypeCode(code)) return null
  const titleRaw = typeof raw.title === 'string' ? raw.title.trim() : ''
  const title = titleRaw ? titleRaw.slice(0, 80) : code
  const stackRaw = Array.isArray(raw.stack) ? raw.stack : null
  if (!stackRaw || stackRaw.length !== 4) return null
  const stack = stackRaw.map(asFunctionId)
  if (stack.some((id) => !id)) return null
  const percents: ResultSnapshot['percents'] = {}
  const incoming = raw.percents && typeof raw.percents === 'object' ? (raw.percents as Record<string, unknown>) : {}
  for (const id of FUNCTION_IDS) {
    const n = Number(incoming[id])
    if (!Number.isFinite(n)) continue
    percents[id] = Math.max(0, Math.min(100, Math.round(n)))
  }
  return {
    code,
    title,
    stack: [stack[0]!, stack[1]!, stack[2]!, stack[3]!],
    percents,
  }
}

export function inviteTtlSec() {
  return INVITE_TTL_SEC
}

export type InviteWait = {
  email: string
  name: string
}

export type InviteRecord = {
  snapshot?: ResultSnapshot
  at?: string
  wait?: InviteWait
  pingedAt?: string
}

export function parseInviteWait(value: unknown): InviteWait | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const email = String(raw.email ?? '')
    .trim()
    .toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) return null
  const name = String(raw.name ?? '').trim().slice(0, 40)
  return { email, name: name || 'Someone' }
}

export function parseInviteRecord(raw: string | null | undefined): InviteRecord | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as InviteRecord
    if (!parsed || typeof parsed !== 'object') return null
    const snapshot = snapshotOnly(parsed.snapshot)
    const wait = parseInviteWait(parsed.wait)
    const at = typeof parsed.at === 'string' ? parsed.at : undefined
    const pingedAt = typeof parsed.pingedAt === 'string' ? parsed.pingedAt : undefined
    if (!snapshot && !wait) return null
    return {
      snapshot: snapshot ?? undefined,
      at,
      wait: wait ?? undefined,
      pingedAt,
    }
  } catch {
    return null
  }
}
