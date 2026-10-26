import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { WORKSPACE_OFFERED, WORKSPACE_PATH } from '../lib/workspace/offered'
import { hydrateHouse } from '../lib/workspace/store'
import { Analytics } from './Analytics'
import { EditBar } from './EditBar'
import { Footer } from './Footer'
import { Header } from './Header'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  const location = useLocation()
  const darkHouse = WORKSPACE_OFFERED && location.pathname.startsWith(WORKSPACE_PATH)

  useEffect(() => {
    const theme = document.querySelector('meta[name="theme-color"]')
    document.documentElement.classList.toggle('workspace-skin', darkHouse)
    document.body.classList.toggle('workspace-skin', darkHouse)
    theme?.setAttribute('content', darkHouse ? '#161616' : '#ffffff')
    return () => {
      document.documentElement.classList.remove('workspace-skin')
      document.body.classList.remove('workspace-skin')
      theme?.setAttribute('content', '#ffffff')
    }
  }, [darkHouse])

  useEffect(() => {
    if (WORKSPACE_OFFERED) void hydrateHouse()
  }, [])

  return (
    <>
      <Analytics />
      <ScrollToTop />
      {darkHouse ? null : <EditBar />}
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
