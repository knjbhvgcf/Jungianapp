import {
  allowedOrigin,
  houseForRequest,
  saveHouseForRequest,
  type AccountEnv,
} from '../../src/lib/workspace/accountServer.ts'

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
  const result = await houseForRequest(env, {
    cookieHeader: request.headers.get('Cookie'),
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, result.house)
}

export async function onRequestPut(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }
  const result = await saveHouseForRequest(env, {
    cookieHeader: request.headers.get('Cookie'),
    body,
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, result.house)
}
