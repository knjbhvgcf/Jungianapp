import {
  handleWorkspaceStripeWebhook,
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
  const rawBody = await request.text()
  const result = await handleWorkspaceStripeWebhook(env, {
    rawBody,
    signature: request.headers.get('Stripe-Signature'),
  })
  if (!result.ok) return json(result.status, { error: result.error })
  return json(200, { received: true })
}
