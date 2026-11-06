import type { ResultSnapshot } from './types'
import { parseInviteToken, snapshotOnly } from './invitePacket'

function inviteApiOrigin() {
  try {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const { hostname, port } = window.location
      if (hostname === '127.0.0.1' || hostname === 'localhost') {
        if (port === '8081' || port === '19006' || port === '8082') return 'http://127.0.0.1:5173'
        return ''
      }
      if (
        hostname === 'jungology.com' ||
        hostname === 'www.jungology.com' ||
        hostname.endsWith('.pages.dev')
      ) {
        return ''
      }
    }
  } catch {
    /* native */
  }
  return 'https://jungology.com'
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as { snapshot?: unknown; error?: string }
  } catch {
    return {}
  }
}

export async function sendInviteSnapshot(token: string, snapshot: ResultSnapshot) {
  const clean = parseInviteToken(token)
  const body = snapshotOnly(snapshot)
  if (!clean || !body) return { ok: false as const, error: 'Need a type and the eight percentages. Not the answers.' }
  const response = await fetch(`${inviteApiOrigin()}/api/workspace-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: clean, snapshot: body }),
  })
  const payload = await readJson(response)
  if (!response.ok) {
    return { ok: false as const, error: payload.error || 'Could not send the type.' }
  }
  return { ok: true as const }
}

export async function registerInviteWait(token: string, email: string, name: string) {
  const clean = parseInviteToken(token)
  if (!clean) return { ok: false as const, error: 'That invite is not valid.' }
  const response = await fetch(`${inviteApiOrigin()}/api/workspace-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: clean, wait: { email, name } }),
  })
  const payload = await readJson(response)
  if (!response.ok) {
    return { ok: false as const, error: payload.error || 'Could not arm the ping.' }
  }
  return { ok: true as const }
}

export async function readInviteSnapshot(token: string) {
  const clean = parseInviteToken(token)
  if (!clean) return { ok: false as const, snapshot: null, error: 'That invite is not valid.' }
  const response = await fetch(
    `${inviteApiOrigin()}/api/workspace-invite?token=${encodeURIComponent(clean)}`,
  )
  if (response.status === 404) return { ok: true as const, snapshot: null }
  const payload = await readJson(response)
  if (!response.ok) {
    return { ok: false as const, snapshot: null, error: payload.error || 'Could not look for their result.' }
  }
  const snapshot = snapshotOnly(payload.snapshot)
  return { ok: true as const, snapshot }
}
