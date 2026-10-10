import { loadAnswers, loadClarifyAnswers } from './storage'
import { isTypeCode, type CensusSnapshot, type TypeCode } from './typeCensusShared'

const POSTED_KEY = 'jung-census.posted.v1'
const inflight = new Set<string>()

async function fingerprint() {
  const payload = JSON.stringify({
    answers: loadAnswers(),
    clarify: loadClarifyAnswers(),
  })
  const bytes = new TextEncoder().encode(payload)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function reportTypeCensus(input: { suggested: string; selected: string }) {
  if (typeof window === 'undefined') return
  const suggested = input.suggested.toUpperCase()
  const selected = input.selected.toUpperCase()
  if (!isTypeCode(suggested) || !isTypeCode(selected)) return

  const stamp = await fingerprint()
  if (window.localStorage.getItem(POSTED_KEY) === stamp || inflight.has(stamp)) return
  inflight.add(stamp)

  try {
    const response = await fetch('/api/type-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggested, selected }),
    })
    if (!response.ok) {
      inflight.delete(stamp)
      return
    }
    window.localStorage.setItem(POSTED_KEY, stamp)
  } catch {
    inflight.delete(stamp)
    /* census is diagnostic; a failed post must not affect results */
  }
}

export async function fetchTypeCensus(password: string): Promise<CensusSnapshot & { configured: boolean }> {
  const response = await fetch('/api/type-stats', {
    headers: { Authorization: `Bearer ${password}` },
  })
  const body = (await response.json().catch(() => ({}))) as CensusSnapshot & {
    configured?: boolean
    error?: string
  }
  if (response.status === 503) {
    throw new Error(body.error ?? 'Type census is not configured on this host yet.')
  }
  if (!response.ok) {
    throw new Error(body.error ?? 'Could not load type census')
  }
  return { ...body, configured: body.configured !== false }
}

export type { CensusSnapshot, TypeCode }
