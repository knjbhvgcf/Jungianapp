import { allowedOrigin, type AccountEnv } from '../../src/lib/workspace/accountServer.ts'
import { handleInviteGet, handleInvitePost } from '../../src/lib/workspace/inviteMailbox.ts'

type PagesContext = { request: Request; env: AccountEnv }

function corsHeaders(request: Request) {
  const origin = request.headers.get('Origin')
  if (!origin || !allowedOrigin(request)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(request: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
  })
}

export async function onRequestOptions(context: PagesContext) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) })
}

export async function onRequestPost(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(request, 403, { error: 'Forbidden' })
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return json(request, 400, { error: 'Invalid JSON' })
  }
  const result = await handleInvitePost(env, payload)
  return json(request, result.status, result.body)
}

export async function onRequestGet(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(request, 403, { error: 'Forbidden' })
  const result = await handleInviteGet(env, new URL(request.url).searchParams.get('token'))
  return json(request, result.status, result.body)
}
