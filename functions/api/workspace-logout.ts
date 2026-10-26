import {
  allowedOrigin,
  logoutCookie,
  type AccountEnv,
} from '../../src/lib/workspace/accountServer.ts'

type PagesContext = { request: Request; env: AccountEnv }

function json(status: number, body: unknown, setCookie?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return new Response(JSON.stringify(body), { status, headers })
}

export async function onRequestPost(context: PagesContext) {
  const { request } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })
  const result = await logoutCookie(new URL(request.url).origin)
  return json(200, { ok: true }, result.setCookie)
}
