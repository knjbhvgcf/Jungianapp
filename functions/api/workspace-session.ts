import {
  allowedOrigin,
  normalizeEmail,
  signedInEmail,
  type AccountEnv,
} from '../../src/lib/workspace/accountServer.ts'
import { readWorkspaceCheckoutSession } from '../../src/lib/workspace/stripeServer.ts'

type PagesContext = { request: Request; env: AccountEnv }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestGet(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })
  const who = await signedInEmail(env, request.headers.get('Cookie'))
  if (!who.ok) return json(who.status, { error: who.error })
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? ''
  const result = await readWorkspaceCheckoutSession(env, sessionId)
  if (!result.ok) return json(result.status, { error: result.error })
  if (result.info.email && normalizeEmail(result.info.email) !== who.email) {
    return json(403, { error: 'That checkout belongs to a different email.' })
  }
  return json(200, result.info)
}
