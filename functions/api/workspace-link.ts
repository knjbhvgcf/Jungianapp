import {
  allowedOrigin,
  clientIp,
  requestMagicLink,
  type AccountEnv,
} from '../../src/lib/workspace/accountServer.ts'

type PagesContext = { request: Request; env: AccountEnv }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestPost(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })

  let payload: { email?: string }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const result = await requestMagicLink(env, {
    email: String(payload.email ?? ''),
    origin: new URL(request.url).origin,
    ip: clientIp(request.headers),
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, { sent: true, devLink: result.devLink })
}
