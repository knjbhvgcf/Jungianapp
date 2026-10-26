import {
  allowedOrigin,
  checkoutForRequest,
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
  const result = await checkoutForRequest(env, {
    cookieHeader: request.headers.get('Cookie'),
    origin: new URL(request.url).origin,
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, { url: result.url })
}
