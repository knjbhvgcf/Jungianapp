import { createWorkspaceCheckoutSession, type StripeEnv } from '../../src/lib/workspace/stripeServer.ts'

type PagesContext = { request: Request; env: StripeEnv }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get('Origin')
  if (!origin) return true
  try {
    const host = new URL(origin).hostname
    return (
      host === 'jungology.com' ||
      host === 'www.jungology.com' ||
      host.endsWith('.pages.dev') ||
      host === '127.0.0.1' ||
      host === 'localhost'
    )
  } catch {
    return false
  }
}

export async function onRequestPost(context: PagesContext) {
  const { request, env } = context
  if (!allowedOrigin(request)) return json(403, { error: 'Forbidden' })

  let payload: { email?: string; customerId?: string }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }

  const email = String(payload.email ?? '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: 'Need an email this house can belong to.' })

  const result = await createWorkspaceCheckoutSession(env, {
    email,
    origin: new URL(request.url).origin,
    customerId: String(payload.customerId ?? '').trim() || undefined,
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, { url: result.url })
}
