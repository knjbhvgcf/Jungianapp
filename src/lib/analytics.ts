const token = (import.meta.env.VITE_CF_BEACON_TOKEN as string | undefined)?.trim()

export function initAnalytics() {
  if (!token || typeof document === 'undefined') return
  if (document.getElementById('cf-beacon-script')) return

  const script = document.createElement('script')
  script.id = 'cf-beacon-script'
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.setAttribute('data-cf-beacon', JSON.stringify({ token, spa: true }))
  document.head.appendChild(script)
}
