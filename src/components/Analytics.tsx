import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  initCloudflareAnalytics,
  initGa4,
  shouldTrackPath,
  trackPageView,
} from '../lib/analytics'

export function Analytics() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    initCloudflareAnalytics()
  }, [])

  useEffect(() => {
    if (!shouldTrackPath(pathname)) return
    initGa4()
    trackPageView(pathname, search)
  }, [pathname, search])

  return null
}
