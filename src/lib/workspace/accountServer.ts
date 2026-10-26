import {
  createWorkspaceCheckoutSession,
  createWorkspacePortalSession,
  readStripeCustomerEmail,
  readWorkspaceCheckoutSession,
  verifyStripeWebhookSignature,
  type StripeEnv,
} from './stripeServer.ts'
import type { WorkspaceHouse, WorkspacePlan } from './types.ts'

export type KvStore = {
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
  delete: (key: string) => Promise<void>
}

export type AccountEnv = {
  SESSION_SECRET?: string
  RESEND_API_KEY?: string
  RESEND_FROM?: string
  WORKSPACE_HOUSES?: KvStore
} & StripeEnv

export const SESSION_COOKIE = 'jungology_session'
const LINK_TTL_SEC = 15 * 60
const SESSION_TTL_SEC = 30 * 24 * 60 * 60
const LINK_EMAIL_LIMIT = 3
const LINK_IP_LIMIT = 20
const LOCAL_LINK_EMAIL_LIMIT = 20
const LOCAL_LINK_IP_LIMIT = 40
const RATE_WAIT = 'Wait a few minutes, then try again.'
const MISSING_SECRET = {
  ok: false as const,
  status: 503 as const,
  error: 'Session secret is not set.',
}

export function allowedOrigin(request: { headers: { get: (name: string) => string | null } }) {
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

export function looksLikeEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value)
}

export function isLocalOrigin(origin: string) {
  try {
    const host = new URL(origin).hostname
    return host === '127.0.0.1' || host === 'localhost'
  } catch {
    return false
  }
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function clientIp(headers: { get: (name: string) => string | null }) {
  const cf = headers.get('CF-Connecting-IP')?.trim()
  if (cf) return cf
  const forwarded = headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
  return forwarded || ''
}

function rateKey(kind: 'email' | 'ip', value: string) {
  return `rate:link:${kind}:${value}`
}

async function takeLinkSlot(kv: KvStore, key: string, limit: number) {
  const raw = await kv.get(key)
  const n = Number(raw)
  const count = Number.isFinite(n) && n > 0 ? n : 0
  if (count >= limit) return false
  await kv.put(key, String(count + 1), { expirationTtl: LINK_TTL_SEC })
  return true
}

function requireSessionSecret(env: AccountEnv) {
  const secret = env.SESSION_SECRET?.trim()
  if (!secret) return MISSING_SECRET
  return { ok: true as const, secret }
}

export async function signedInEmail(env: AccountEnv, cookieHeader: string | null) {
  const secret = requireSessionSecret(env)
  if (!secret.ok) return secret
  const email = await emailFromSession(secret.secret, cookieHeader)
  if (!email) {
    return { ok: false as const, status: 401 as const, error: 'Sign in with email.' }
  }
  return { ok: true as const, email }
}

function houseKey(email: string) {
  return `house:${normalizeEmail(email)}`
}

function linkKey(token: string) {
  return `link:${token}`
}

function bytesToB64url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function utf8ToB64url(value: string) {
  return bytesToB64url(new TextEncoder().encode(value))
}

function b64urlToUtf8(value: string) {
  return new TextDecoder().decode(b64urlToBytes(value))
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return bytesToB64url(new Uint8Array(sig))
}

function randomToken() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToB64url(bytes)
}

export function parseHouse(value: unknown): WorkspaceHouse | null {
  if (!value || typeof value !== 'object') return null
  const house = value as WorkspaceHouse
  if (typeof house.email !== 'string' || !Array.isArray(house.people) || !Array.isArray(house.hours)) {
    return null
  }
  return house
}

export function emptyAccountHouse(email: string): WorkspaceHouse {
  return {
    email: normalizeEmail(email),
    auth: 'email',
    plan: 'none',
    createdAt: new Date().toISOString(),
    self: null,
    people: [],
    hours: [],
  }
}

function serverBilling(existing: WorkspaceHouse | null): Pick<
  WorkspaceHouse,
  'plan' | 'stripeCustomerId' | 'stripeSubscriptionId' | 'planUpdatedAt'
> {
  return {
    plan: existing?.plan ?? 'none',
    stripeCustomerId: existing?.stripeCustomerId,
    stripeSubscriptionId: existing?.stripeSubscriptionId,
    planUpdatedAt: existing?.planUpdatedAt,
  }
}

function cookieSecure(origin: string) {
  return origin.startsWith('https://')
}

export function sessionCookieHeader(value: string, origin: string, maxAge: number) {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (cookieSecure(origin)) parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookieHeader(origin: string) {
  return sessionCookieHeader('', origin, 0)
}

export async function makeSessionValue(secret: string, email: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  const payload = `${utf8ToB64url(normalizeEmail(email))}.${exp}`
  const sig = await hmacHex(secret, payload)
  return `${payload}.${sig}`
}

export async function emailFromSession(secret: string, cookieHeader: string | null) {
  if (!secret || !cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))
  const value = match?.[1]
  if (!value) return null
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [emailPart, expPart, sig] = parts
  if (!emailPart || !expPart || !sig) return null
  const payload = `${emailPart}.${expPart}`
  const expected = await hmacHex(secret, payload)
  if (expected !== sig) return null
  const exp = Number(expPart)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null
  const email = b64urlToUtf8(emailPart)
  return looksLikeEmail(email) ? normalizeEmail(email) : null
}

export async function readHouse(env: AccountEnv, email: string) {
  if (!env.WORKSPACE_HOUSES) return null
  const raw = await env.WORKSPACE_HOUSES.get(houseKey(email))
  if (!raw) return null
  try {
    return parseHouse(JSON.parse(raw))
  } catch {
    return null
  }
}

function stripeCustomerKey(id: string) {
  return `stripe:cus:${id}`
}

function stripeSubscriptionKey(id: string) {
  return `stripe:sub:${id}`
}

export async function writeHouseRecord(env: AccountEnv, house: WorkspaceHouse) {
  if (!env.WORKSPACE_HOUSES) {
    return { ok: false as const, status: 503, error: 'House storage is not bound yet.' }
  }
  const email = normalizeEmail(house.email)
  const next: WorkspaceHouse = { ...house, email, auth: house.auth ?? 'email' }
  await env.WORKSPACE_HOUSES.put(houseKey(email), JSON.stringify(next))
  if (next.stripeCustomerId?.startsWith('cus_')) {
    await env.WORKSPACE_HOUSES.put(stripeCustomerKey(next.stripeCustomerId), email)
  }
  if (next.stripeSubscriptionId?.startsWith('sub_')) {
    await env.WORKSPACE_HOUSES.put(stripeSubscriptionKey(next.stripeSubscriptionId), email)
  }
  return { ok: true as const, house: next }
}

export async function requestMagicLink(
  env: AccountEnv,
  opts: { email: string; origin: string; ip?: string },
) {
  const email = normalizeEmail(opts.email)
  if (!looksLikeEmail(email)) {
    return { ok: false as const, status: 400, error: 'Need an email this account can belong to.' }
  }
  if (!env.WORKSPACE_HOUSES) {
    return { ok: false as const, status: 503, error: 'House storage is not bound yet.' }
  }
  const local = isLocalOrigin(opts.origin)
  const emailOk = await takeLinkSlot(
    env.WORKSPACE_HOUSES,
    rateKey('email', email),
    local ? LOCAL_LINK_EMAIL_LIMIT : LINK_EMAIL_LIMIT,
  )
  if (!emailOk) {
    return { ok: false as const, status: 429, error: RATE_WAIT }
  }
  const ip = opts.ip?.trim()
  if (ip) {
    const ipOk = await takeLinkSlot(
      env.WORKSPACE_HOUSES,
      rateKey('ip', ip),
      local ? LOCAL_LINK_IP_LIMIT : LINK_IP_LIMIT,
    )
    if (!ipOk) {
      return { ok: false as const, status: 429, error: RATE_WAIT }
    }
  }
  const token = randomToken()
  await env.WORKSPACE_HOUSES.put(linkKey(token), JSON.stringify({ email }), {
    expirationTtl: LINK_TTL_SEC,
  })
  const url = `${opts.origin}/api/workspace-verify?token=${encodeURIComponent(token)}`
  const key = env.RESEND_API_KEY?.trim()
  if (!key) {
    if (!isLocalOrigin(opts.origin)) {
      return { ok: false as const, status: 503, error: 'Email sender is not set.' }
    }
    console.log(`Jungology App sign-in link for ${email}:\n${url}`)
    return { ok: true as const, sent: true, devLink: url }
  }
  const from = env.RESEND_FROM?.trim() || 'Jungology <hello@jungology.com>'
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Sign in to Jungology App',
      text: `Open this link to sign in to Jungology App. It lasts 15 minutes.\n\n${url}\n\nIf you did not ask for this, ignore it.`,
    }),
  })
  if (!response.ok) {
    return { ok: false as const, status: 502, error: 'Could not send the sign-in link.' }
  }
  return { ok: true as const, sent: true as const }
}

export async function verifyMagicLink(env: AccountEnv, opts: { token: string; origin: string }) {
  const secret = requireSessionSecret(env)
  if (!secret.ok) return secret
  if (!env.WORKSPACE_HOUSES) {
    return { ok: false as const, status: 503, error: 'House storage is not bound yet.' }
  }
  const token = opts.token.trim()
  if (!token) {
    return { ok: false as const, status: 400, error: 'Missing sign-in link.' }
  }
  const raw = await env.WORKSPACE_HOUSES.get(linkKey(token))
  await env.WORKSPACE_HOUSES.delete(linkKey(token))
  if (!raw) {
    return { ok: false as const, status: 400, error: 'That sign-in link is used or has expired.' }
  }
  let email = ''
  try {
    const parsed = JSON.parse(raw) as { email?: string }
    email = normalizeEmail(parsed.email ?? '')
  } catch {
    email = ''
  }
  if (!looksLikeEmail(email)) {
    return { ok: false as const, status: 400, error: 'That sign-in link is used or has expired.' }
  }
  if (!(await readHouse(env, email))) {
    await writeHouseRecord(env, emptyAccountHouse(email))
  }
  const cookie = await makeSessionValue(secret.secret, email)
  return {
    ok: true as const,
    email,
    setCookie: sessionCookieHeader(cookie, opts.origin, SESSION_TTL_SEC),
    location: `${opts.origin}/workspace`,
  }
}

export async function houseForRequest(
  env: AccountEnv,
  opts: { cookieHeader: string | null },
) {
  const secret = requireSessionSecret(env)
  if (!secret.ok) return secret
  const email = await emailFromSession(secret.secret, opts.cookieHeader)
  if (!email) {
    return { ok: false as const, status: 401, error: 'Sign in with email.' }
  }
  let house = await readHouse(env, email)
  if (!house) {
    house = emptyAccountHouse(email)
    await writeHouseRecord(env, house)
  }
  return { ok: true as const, house }
}

export async function saveHouseForRequest(
  env: AccountEnv,
  opts: { cookieHeader: string | null; body: unknown },
) {
  const secret = requireSessionSecret(env)
  if (!secret.ok) return secret
  const email = await emailFromSession(secret.secret, opts.cookieHeader)
  if (!email) {
    return { ok: false as const, status: 401, error: 'Sign in with email.' }
  }
  const parsed = parseHouse(opts.body)
  if (!parsed) {
    return { ok: false as const, status: 400, error: 'Need a house with people and hours lists.' }
  }
  const existing = await readHouse(env, email)
  if ((existing?.plan ?? 'none') !== 'active') {
    return { ok: false as const, status: 402, error: 'Start the trial to use Jungology App.' }
  }
  const next: WorkspaceHouse = {
    ...parsed,
    ...serverBilling(existing),
    email,
    auth: 'email',
  }
  const saved = await writeHouseRecord(env, next)
  if (!saved.ok) return saved
  return { ok: true as const, house: saved.house }
}

export async function confirmPaidForRequest(
  env: AccountEnv,
  opts: { cookieHeader: string | null; sessionId: string },
) {
  const secret = requireSessionSecret(env)
  if (!secret.ok) return secret
  const email = await emailFromSession(secret.secret, opts.cookieHeader)
  if (!email) {
    return { ok: false as const, status: 401, error: 'Sign in with email.' }
  }
  const result = await readWorkspaceCheckoutSession(env, opts.sessionId)
  if (!result.ok) return result
  if (!result.info.paid) {
    return { ok: false as const, status: 402, error: 'Stripe did not mark this checkout as paid.' }
  }
  if (result.info.email && normalizeEmail(result.info.email) !== email) {
    return { ok: false as const, status: 403, error: 'That checkout belongs to a different email.' }
  }
  const existing = (await readHouse(env, email)) ?? emptyAccountHouse(email)
  const next: WorkspaceHouse = {
    ...existing,
    email,
    auth: 'email',
    plan: 'active',
    stripeCustomerId: result.info.customer || existing.stripeCustomerId,
    stripeSubscriptionId: result.info.subscription || existing.stripeSubscriptionId,
    planUpdatedAt: new Date().toISOString(),
  }
  const saved = await writeHouseRecord(env, next)
  if (!saved.ok) return saved
  return { ok: true as const, house: saved.house }
}

export async function checkoutForRequest(
  env: AccountEnv,
  opts: { cookieHeader: string | null; origin: string },
) {
  const who = await signedInEmail(env, opts.cookieHeader)
  if (!who.ok) return who
  const house = (await readHouse(env, who.email)) ?? emptyAccountHouse(who.email)
  return createWorkspaceCheckoutSession(env, {
    email: who.email,
    origin: opts.origin,
    customerId: house.stripeCustomerId,
  })
}

export async function portalForRequest(
  env: AccountEnv,
  opts: { cookieHeader: string | null; origin: string },
) {
  const who = await signedInEmail(env, opts.cookieHeader)
  if (!who.ok) return who
  const house = await readHouse(env, who.email)
  return createWorkspacePortalSession(env, {
    customerId: house?.stripeCustomerId ?? '',
    origin: opts.origin,
  })
}

function stripeObjectId(value: unknown) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function stripeFieldEmail(value: unknown) {
  return typeof value === 'string' && looksLikeEmail(value) ? normalizeEmail(value) : ''
}

function emailsFromStripeObject(object: Record<string, unknown>) {
  const emails: string[] = []
  const metadata = object.metadata && typeof object.metadata === 'object' ? object.metadata : null
  const details =
    object.customer_details && typeof object.customer_details === 'object' ? object.customer_details : null
  for (const value of [
    metadata ? (metadata as { email?: unknown }).email : '',
    object.customer_email,
    object.email,
    details ? (details as { email?: unknown }).email : '',
    object.client_reference_id,
  ]) {
    const email = stripeFieldEmail(value)
    if (email && !emails.includes(email)) emails.push(email)
  }
  return emails
}

function planFromStripeEvent(type: string, object: Record<string, unknown>): WorkspacePlan | null {
  if (type === 'customer.subscription.deleted') return 'canceled'
  if (type === 'checkout.session.completed') {
    if (object.mode !== 'subscription') return null
    if (object.payment_status === 'paid' || object.status === 'complete') return 'active'
    return null
  }
  if (type !== 'customer.subscription.updated') return null
  const status = typeof object.status === 'string' ? object.status : ''
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired' || status === 'paused') {
    return 'canceled'
  }
  return null
}

async function houseForStripeIds(
  env: AccountEnv,
  opts: { customerId: string; subscriptionId: string; emails: string[] },
) {
  if (!env.WORKSPACE_HOUSES) return null
  const emails: string[] = []
  if (opts.subscriptionId.startsWith('sub_')) {
    const mapped = await env.WORKSPACE_HOUSES.get(stripeSubscriptionKey(opts.subscriptionId))
    if (mapped) emails.push(normalizeEmail(mapped))
  }
  if (opts.customerId.startsWith('cus_')) {
    const mapped = await env.WORKSPACE_HOUSES.get(stripeCustomerKey(opts.customerId))
    if (mapped) emails.push(normalizeEmail(mapped))
  }
  for (const email of opts.emails) {
    if (!emails.includes(email)) emails.push(email)
  }
  for (const email of emails) {
    const house = await readHouse(env, email)
    if (house) return house
  }
  return null
}

export async function handleWorkspaceStripeWebhook(
  env: AccountEnv,
  opts: { rawBody: string; signature: string | null },
) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim() ?? ''
  if (!webhookSecret.startsWith('whsec_')) {
    return { ok: false as const, status: 503, error: 'Stripe webhook is not set up yet.' }
  }
  const signed = await verifyStripeWebhookSignature(webhookSecret, opts.rawBody, opts.signature)
  if (!signed) {
    return { ok: false as const, status: 400, error: 'Invalid Stripe signature.' }
  }
  let event: { type?: string; data?: { object?: Record<string, unknown> } }
  try {
    event = JSON.parse(opts.rawBody) as typeof event
  } catch {
    return { ok: false as const, status: 400, error: 'Invalid JSON' }
  }
  const type = event.type ?? ''
  const object = event.data?.object
  if (!object || typeof object !== 'object') {
    return { ok: true as const, received: true }
  }
  const plan = planFromStripeEvent(type, object)
  if (!plan) return { ok: true as const, received: true }

  const customerId = stripeObjectId(object.customer)
  const subscriptionId =
    type === 'checkout.session.completed' ? stripeObjectId(object.subscription) : stripeObjectId(object.id)
  const emails = emailsFromStripeObject(object)
  if (customerId.startsWith('cus_') && emails.length === 0) {
    const fromStripe = stripeFieldEmail(await readStripeCustomerEmail(env, customerId))
    if (fromStripe) emails.push(fromStripe)
  }

  const existing = await houseForStripeIds(env, { customerId, subscriptionId, emails })
  if (!existing) return { ok: true as const, received: true }

  const next: WorkspaceHouse = {
    ...existing,
    plan,
    stripeCustomerId: customerId.startsWith('cus_') ? customerId : existing.stripeCustomerId,
    stripeSubscriptionId: subscriptionId.startsWith('sub_')
      ? subscriptionId
      : existing.stripeSubscriptionId,
    planUpdatedAt: new Date().toISOString(),
  }
  const saved = await writeHouseRecord(env, next)
  if (!saved.ok) return saved
  return { ok: true as const, received: true }
}

export async function logoutCookie(origin: string) {
  return { ok: true as const, setCookie: clearSessionCookieHeader(origin) }
}
