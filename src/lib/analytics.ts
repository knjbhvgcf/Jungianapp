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
  const id = getGaMeasurementId()
  if (!id || typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const pagePath = analyticsPagePath(pathname, search)
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: document.title,
  })
}
