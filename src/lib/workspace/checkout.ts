import { trackBeginCheckout, trackPurchase } from '../analytics'
import { confirmWorkspacePaid } from './accountClient'
import { WORKSPACE_NAME, WORKSPACE_PRICE } from './offered'
import { applyRemoteHouse } from './store'

const CHECKOUT_NOTE_KEY = 'jung-functions.workspace.checkout.v1'

/** Public Payment Link. Env overrides this if Cloudflare has it. */
const FALLBACK_WORKSPACE_CHECKOUT_URL = 'https://buy.stripe.com/6oU7sN8bpajN3VkeTMeIw04'

function looksLikeEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value)
}

export function workspaceCheckoutUrl() {
  const raw = import.meta.env.VITE_WORKSPACE_CHECKOUT_URL
  const url = typeof raw === 'string' ? raw.trim() : ''
  return url || FALLBACK_WORKSPACE_CHECKOUT_URL
}

export function workspacePortalUrl() {
  const raw = import.meta.env.VITE_WORKSPACE_PORTAL_URL
  return typeof raw === 'string' ? raw.trim() : ''
}

export function takeCheckoutNote() {
  if (typeof sessionStorage === 'undefined') return ''
  const note = sessionStorage.getItem(CHECKOUT_NOTE_KEY) ?? ''
  if (note) sessionStorage.removeItem(CHECKOUT_NOTE_KEY)
  return note
}

function setCheckoutNote(note: string) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(CHECKOUT_NOTE_KEY, note)
}

function paymentLink(email: string) {
  const href = workspaceCheckoutUrl()
  if (!href) return ''
  try {
    const url = new URL(href)
    if (looksLikeEmail(email)) url.searchParams.set('prefilled_email', email)
    return url.toString()
  } catch {
    return href
  }
}

export async function startWorkspaceCheckout(email: string) {
  const response = await fetch('/api/workspace-checkout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  let apiError = ''
  if (response.ok) {
    const body = (await response.json()) as { url?: string; error?: string }
    if (body.url) {
      trackBeginCheckout('workspace', body.url)
      return body.url
    }
    apiError = body.error ?? ''
  } else {
    try {
      const body = (await response.json()) as { error?: string }
      apiError = body.error ?? ''
    } catch {
      apiError = ''
    }
  }
  if (response.status === 400) {
    throw new Error(apiError || 'Need an email this account can belong to.')
  }
  const href = paymentLink(email)
  if (href) {
    trackBeginCheckout('workspace', href)
    return href
  }
  throw new Error(apiError || 'Stripe is not set up yet.')
}

export async function startWorkspacePortal() {
  const response = await fetch('/api/workspace-portal', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (response.ok) {
    const body = (await response.json()) as { url?: string }
    if (body.url) return body.url
  }
  const href = workspacePortalUrl()
  if (href) return href
  throw new Error('Stripe billing portal is not set up yet.')
}

export async function settleWorkspaceCheckout(sessionId: string | null) {
  if (!sessionId?.startsWith('cs_')) {
    setCheckoutNote(
      `Stripe came back, but this page could not confirm payment. ${WORKSPACE_NAME} is not marked subscribed.`,
    )
    return false
  }
  try {
    const house = await confirmWorkspacePaid(sessionId)
    applyRemoteHouse(house)
    if (house.plan !== 'active') {
      setCheckoutNote(`Stripe did not mark ${WORKSPACE_NAME} as paid.`)
      return false
    }
    trackPurchase('workspace')
    setCheckoutNote(`Stripe has ${WORKSPACE_NAME} at ${WORKSPACE_PRICE} / month.`)
    return true
  } catch {
    setCheckoutNote(
      `Stripe checkout came back, but this page could not confirm it. ${WORKSPACE_NAME} is not marked subscribed.`,
    )
    return false
  }
}

export function markWorkspaceCheckoutCanceled() {
  setCheckoutNote('Stripe was closed. Nothing was charged.')
}
