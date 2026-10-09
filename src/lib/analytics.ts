const FALLBACK_GA_MEASUREMENT_ID = 'G-KPPV97KWXN'

const cfToken = (import.meta.env.VITE_CF_BEACON_TOKEN as string | undefined)?.trim()
const gaMeasurementId =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() ||
  FALLBACK_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function isGaMeasurementId(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value)
}

export function getGaMeasurementId() {
  return gaMeasurementId && isGaMeasurementId(gaMeasurementId) ? gaMeasurementId : ''
}

export function shouldTrackPath(pathname: string) {
  return pathname !== '/admin' && !pathname.startsWith('/admin/')
}

/** Drop unlock keys from the URL we send to GA. Quiz answers are not in the URL. */
export function analyticsPagePath(pathname: string, search: string) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  params.delete('key')
  const cleaned = params.toString()
  return cleaned ? `${pathname}?${cleaned}` : pathname
}

export function initCloudflareAnalytics() {
  if (!cfToken || typeof document === 'undefined') return
  if (document.getElementById('cf-beacon-script')) return

  const script = document.createElement('script')
  script.id = 'cf-beacon-script'
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: cfToken, spa: true }))
  document.head.appendChild(script)
}

export function initGa4() {
  const id = getGaMeasurementId()
  if (!id || typeof document === 'undefined') return
  if (document.getElementById('ga4-gtag')) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id, {
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.id = 'ga4-gtag'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)
}

export function trackPageView(pathname: string, search = '') {
  if (typeof window === 'undefined') return
  const pagePath = analyticsPagePath(pathname, search)
  sendGaEvent('page_view', {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: document.title,
  })
}

export type CommerceItem = 'reveal' | 'map' | 'compat'

const PURCHASE_FLAG: Record<CommerceItem, string> = {
  reveal: 'jung-ga.purchase.reveal.v1',
  map: 'jung-ga.purchase.map.v1',
  compat: 'jung-ga.purchase.compat.v1',
}

const CATALOG: Record<
  CommerceItem,
  { item_id: string; item_name: string; fallbackPrice: number }
> = {
  reveal: { item_id: 'type-reveal', item_name: 'Your type', fallbackPrice: 1 },
  map: { item_id: 'type-in-depth', item_name: 'Your Type in Depth', fallbackPrice: 3 },
  compat: { item_id: 'compatibility', item_name: 'Compatibility', fallbackPrice: 1 },
}

function dollars(raw: string | undefined, fallback: number) {
  const n = Number(String(raw ?? '').replace(/[^0-9.]+/g, ''))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function catalogPrice(item: CommerceItem) {
  const row = CATALOG[item]
  if (item === 'reveal') return dollars(import.meta.env.VITE_REVEAL_PRICE, row.fallbackPrice)
  if (item === 'compat') return dollars(import.meta.env.VITE_COMPAT_PRICE, row.fallbackPrice)
  return dollars(import.meta.env.VITE_DOSSIER_PRICE, row.fallbackPrice)
}

function sendGaEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (!getGaMeasurementId()) return
  initGa4()
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

function commerceItems(item: CommerceItem, price: number) {
  const row = CATALOG[item]
  return [{ item_id: row.item_id, item_name: row.item_name, price, quantity: 1 }]
}

/** Stripe Payment Link click. Does not send the unlock key. Skip in-site fallbacks. */
export function trackBeginCheckout(item: CommerceItem, href?: string) {
  if (href && !/^https?:\/\//.test(href)) return
  const price = catalogPrice(item)
  sendGaEvent('begin_checkout', {
    currency: 'USD',
    value: price,
    items: commerceItems(item, price),
  })
}

/**
 * Successful return from Stripe (`?key=` unlock). Once per browser until they
 * clear answers or retake (reveal only).
 */
export function trackPurchase(item: CommerceItem) {
  if (typeof window === 'undefined' || !window.localStorage) return
  const flag = PURCHASE_FLAG[item]
  if (window.localStorage.getItem(flag) === '1') return
  window.localStorage.setItem(flag, '1')
  const price = catalogPrice(item)
  sendGaEvent('purchase', {
    transaction_id: `jung-${item}-${Date.now()}`,
    currency: 'USD',
    value: price,
    items: commerceItems(item, price),
  })
}

export function resetPurchaseTracking(item?: CommerceItem) {
  if (typeof window === 'undefined' || !window.localStorage) return
  const keys = item ? [PURCHASE_FLAG[item]] : Object.values(PURCHASE_FLAG)
  for (const key of keys) window.localStorage.removeItem(key)
}
