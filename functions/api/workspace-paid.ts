import {
  allowedOrigin,
  confirmPaidForRequest,
  type AccountEnv,
} from '../../src/lib/workspace/accountServer.ts'

type PagesContext = { request: Request; env: AccountEnv }

function json(status: number, body: unknown, setCookie?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return new Response(JSON.stringify(body), { status, headers })
}

export async function onRequestPost(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })

  let payload: { sessionId?: string }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const result = await confirmPaidForRequest(env, {
    cookieHeader: request.headers.get('Cookie'),
    sessionId: String(payload.sessionId ?? ''),
    origin: new URL(request.url).origin,
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, result.house, result.setCookie)
}
