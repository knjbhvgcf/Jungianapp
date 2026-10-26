import {
  verifyMagicLink,
  type AccountEnv,
} from '../../src/lib/workspace/accountServer.ts'

type PagesContext = { request: Request; env: AccountEnv }

export async function onRequestGet(context: PagesContext) {
  const { request, env } = context
  const url = new URL(request.url)
  const result = await verifyMagicLink(env, {
    token: url.searchParams.get('token') ?? '',
    origin: url.origin,
  })
  if (!result.ok) {
    const join = new URL('/workspace/join', url.origin)
    join.searchParams.set('link', 'expired')
    return Response.redirect(join.toString(), 302)
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: result.location,
      'Set-Cookie': result.setCookie,
    },
  })
}
