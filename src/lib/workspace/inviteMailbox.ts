import { sendPlainEmail, type AccountEnv } from './accountServer.ts'
import {
  inviteKvKey,
  inviteTtlSec,
  parseInviteRecord,
  parseInviteToken,
  parseInviteWait,
  snapshotOnly,
  type InviteRecord,
} from './invitePacket.ts'

export async function handleInvitePost(env: AccountEnv, payload: unknown) {
  if (!env.WORKSPACE_HOUSES) return { status: 503, body: { error: 'Invites are not bound yet.' } }
  if (!payload || typeof payload !== 'object') return { status: 400, body: { error: 'Invalid JSON' } }
  const raw = payload as { token?: string; snapshot?: unknown; wait?: unknown }
  const token = parseInviteToken(raw.token)
  if (!token) return { status: 400, body: { error: 'Missing invite.' } }
  const snapshot = snapshotOnly(raw.snapshot)
  const wait = parseInviteWait(raw.wait)
  if (!snapshot && !wait) {
    return {
      status: 400,
      body: { error: snapshot === null && raw.snapshot != null
        ? 'Need a type and the eight percentages. Not the answers.'
        : 'Need a type and the eight percentages, or a wait.' },
    }
  }
  const existing = parseInviteRecord(await env.WORKSPACE_HOUSES.get(inviteKvKey(token))) ?? {}
  const record: InviteRecord = {
    ...existing,
    wait: wait ?? existing.wait,
    snapshot: snapshot ?? existing.snapshot,
    at: snapshot ? new Date().toISOString() : existing.at,
  }
  if (record.snapshot && record.wait && !record.pingedAt) {
    const sent = await sendPlainEmail(env, {
      to: record.wait.email,
      subject: `${record.wait.name} sent ${record.snapshot.code}`,
      text: `${record.wait.name} sent ${record.snapshot.code} to Jungology App. Open Library to Compare.\n\nhttps://jungology.com/workspace`,
    })
    if (sent) record.pingedAt = new Date().toISOString()
  }
  await env.WORKSPACE_HOUSES.put(inviteKvKey(token), JSON.stringify(record), {
    expirationTtl: inviteTtlSec(),
  })
  return { status: 200, body: { ok: true as const } }
}

export async function handleInviteGet(env: AccountEnv, tokenRaw: string | null) {
  if (!env.WORKSPACE_HOUSES) return { status: 503, body: { error: 'Invites are not bound yet.' } }
  const token = parseInviteToken(tokenRaw)
  if (!token) return { status: 400, body: { error: 'Missing invite.' } }
  const record = parseInviteRecord(await env.WORKSPACE_HOUSES.get(inviteKvKey(token)))
  if (!record?.snapshot) return { status: 404, body: { error: 'Nothing yet.' } }
  return { status: 200, body: { snapshot: record.snapshot } }
}
