export type StripeEnv = {
  STRIPE_SECRET_KEY?: string
  STRIPE_WORKSPACE_PRICE_ID?: string
  STRIPE_WEBHOOK_SECRET?: string
}

export type CheckoutSessionInfo = {
  paid: boolean
  email?: string
  customer?: string
  subscription?: string
}

const STRIPE = 'https://api.stripe.com/v1'

function secret(env: StripeEnv) {
  return env.STRIPE_SECRET_KEY?.trim() ?? ''
}

function priceId(env: StripeEnv) {
  return env.STRIPE_WORKSPACE_PRICE_ID?.trim() ?? ''
}

export function stripeConfigured(env: StripeEnv) {
  const key = secret(env)
  const price = priceId(env)
  return key.startsWith('sk_') && price.startsWith('price_')
}

async function stripeRequest(env: StripeEnv, method: 'GET' | 'POST', path: string, params?: Record<string, string>) {
  const key = secret(env)
  if (!key.startsWith('sk_')) {
    return { ok: false as const, status: 503, error: 'Stripe is not set up yet.' }
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
  }
  const init: RequestInit = { method, headers }
  let href = `${STRIPE}${path}`
  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = new URLSearchParams(params ?? {}).toString()
  } else if (params && Object.keys(params).length > 0) {
    href += `?${new URLSearchParams(params).toString()}`
  }
  const response = await fetch(href, init)
  const body = (await response.json()) as {
    error?: { message?: string }
    url?: string
    id?: string
    status?: string
    payment_status?: string
    customer?: string | { id?: string }
    subscription?: string | { id?: string }
    customer_email?: string | null
    customer_details?: { email?: string | null }
    email?: string | null
    data?: Array<{
      id?: string
      status?: string
      payment_status?: string
      email?: string | null
      customer?: string | { id?: string }
      subscription?: string | { id?: string }
      customer_details?: { email?: string | null }
    }>
  }
  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status >= 400 && response.status < 600 ? response.status : 502,
      error: body.error?.message || 'Stripe could not complete that.',
    }
  }
  return { ok: true as const, body }
}

function customerId(value: string | { id?: string } | undefined) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.id ?? ''
}

export async function createWorkspaceCheckoutSession(
  env: StripeEnv,
  opts: { email: string; origin: string; customerId?: string },
) {
  if (!stripeConfigured(env)) {
    return { ok: false as const, status: 503, error: 'Stripe is not set up yet.' }
  }
  const params: Record<string, string> = {
    mode: 'subscription',
    'line_items[0][price]': priceId(env),
    'line_items[0][quantity]': '1',
    success_url: `${opts.origin}/workspace?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/workspace?checkout=cancel`,
    allow_promotion_codes: 'true',
    'metadata[product]': 'workspace',
    'subscription_data[trial_period_days]': '7',
    'subscription_data[metadata][product]': 'workspace',
  }
  if (opts.email) {
    params.client_reference_id = opts.email.slice(0, 200)
    params['metadata[email]'] = opts.email
    params['subscription_data[metadata][email]'] = opts.email
  }
  if (opts.customerId?.startsWith('cus_')) {
    params.customer = opts.customerId
  } else if (opts.email) {
    params.customer_email = opts.email
  }
  const result = await stripeRequest(env, 'POST', '/checkout/sessions', params)
  if (!result.ok) return result
  if (!result.body.url) {
    return { ok: false as const, status: 502, error: 'Stripe did not return a checkout URL.' }
  }
  return { ok: true as const, url: result.body.url }
}

export async function readWorkspaceCheckoutSession(env: StripeEnv, sessionId: string) {
  if (!sessionId.startsWith('cs_')) {
    return { ok: false as const, status: 400, error: 'Unknown checkout session.' }
  }
  if (!secret(env).startsWith('sk_')) {
    return { ok: false as const, status: 503, error: 'Stripe is not set up yet.' }
  }
  const result = await stripeRequest(
    env,
    'GET',
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
  )
  if (!result.ok) return result
  const paid = checkoutSessionReady(result.body)
  const info: CheckoutSessionInfo = {
    paid,
    email: result.body.customer_details?.email || result.body.customer_email || undefined,
    customer: customerId(result.body.customer) || undefined,
    subscription: customerId(result.body.subscription) || undefined,
  }
  return { ok: true as const, info }
}

function checkoutSessionReady(body: { status?: string; payment_status?: string }) {
  return (
    body.payment_status === 'paid' ||
    body.payment_status === 'no_payment_required' ||
    body.status === 'complete'
  )
}

function subscriptionLive(status: string) {
  return status === 'active' || status === 'trialing'
}

export async function findLiveWorkspaceSubscription(env: StripeEnv, email: string) {
  const wanted = email.trim().toLowerCase()
  const customers: Array<{ id?: string; email?: string | null }> = []

  const listed = await stripeRequest(env, 'GET', '/customers', { email, limit: '10' })
  if (listed.ok) customers.push(...(listed.body.data ?? []))

  const searched = await stripeRequest(env, 'GET', '/customers/search', {
    query: `email:'${wanted.replace(/'/g, '')}'`,
    limit: '10',
  })
  if (searched.ok) customers.push(...(searched.body.data ?? []))

  if (customers.length === 0) {
    const recent = await stripeRequest(env, 'GET', '/customers', { limit: '30' })
    if (recent.ok) {
      customers.push(
        ...(recent.body.data ?? []).filter((row) => (row.email ?? '').toLowerCase() === wanted),
      )
    }
  }

  const seen = new Set<string>()
  for (const row of customers) {
    const id = row.id ?? ''
    if (!id.startsWith('cus_') || seen.has(id)) continue
    seen.add(id)
    const subs = await stripeRequest(env, 'GET', '/subscriptions', {
      customer: id,
      status: 'all',
      limit: '10',
    })
    if (!subs.ok) return subs
    const live = (subs.body.data ?? []).find((item) => subscriptionLive(item.status ?? ''))
    if (live?.id?.startsWith('sub_')) {
      return {
        ok: true as const,
        customer: id,
        subscription: live.id,
      }
    }
  }

  const sessions = await stripeRequest(env, 'GET', '/checkout/sessions', { limit: '25' })
  if (sessions.ok) {
    for (const row of sessions.body.data ?? []) {
      const sessionEmail = (row.customer_details?.email || row.email || '').toLowerCase()
      if (sessionEmail !== wanted) continue
      if (!checkoutSessionReady(row) && !subscriptionLive(row.status ?? '')) continue
      const customer = customerId(row.customer)
      const subscription = customerId(row.subscription)
      if (customer.startsWith('cus_') && subscription.startsWith('sub_')) {
        return { ok: true as const, customer, subscription }
      }
    }
  }

  return { ok: true as const, customer: '', subscription: '' }
}

export async function createWorkspacePortalSession(
  env: StripeEnv,
  opts: { customerId: string; origin: string },
) {
  if (!opts.customerId.startsWith('cus_')) {
    return { ok: false as const, status: 400, error: 'No Stripe customer on this house yet.' }
  }
  const result = await stripeRequest(env, 'POST', '/billing_portal/sessions', {
    customer: opts.customerId,
    return_url: `${opts.origin}/workspace`,
  })
  if (!result.ok) return result
  if (!result.body.url) {
    return { ok: false as const, status: 502, error: 'Stripe did not return a portal URL.' }
  }
  return { ok: true as const, url: result.body.url }
}

function bytesToHex(bytes: Uint8Array) {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let mix = 0
  for (let i = 0; i < left.length; i += 1) mix |= left.charCodeAt(i) ^ right.charCodeAt(i)
  return mix === 0
}

export async function verifyStripeWebhookSignature(
  secret: string,
  payload: string,
  signatureHeader: string | null,
) {
  if (!secret.startsWith('whsec_') || !signatureHeader) return false
  let timestamp = ''
  const signatures: string[] = []
  for (const part of signatureHeader.split(',')) {
    const cut = part.indexOf('=')
    if (cut < 1) continue
    const key = part.slice(0, cut).trim()
    const value = part.slice(cut + 1).trim()
    if (key === 't') timestamp = value
    if (key === 'v1') signatures.push(value)
  }
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!timestamp || !Number.isFinite(age) || age > 300 || signatures.length === 0) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signed = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  )
  const expected = bytesToHex(new Uint8Array(signed))
  return signatures.some((signature) => timingSafeEqual(expected, signature))
}

export async function readStripeCustomerEmail(env: StripeEnv, customerId: string) {
  if (!customerId.startsWith('cus_')) return ''
  const result = await stripeRequest(env, 'GET', `/customers/${encodeURIComponent(customerId)}`)
  if (!result.ok) return ''
  const email = result.body.email?.trim() ?? ''
  return email.includes('@') ? email : ''
}
