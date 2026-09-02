import { Outlet } from 'react-router-dom'
import { Analytics } from './Analytics'
import { EditBar } from './EditBar'
import { Footer } from './Footer'
import { Header } from './Header'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  return (
    <>
      <Analytics />
      <ScrollToTop />
      <EditBar />
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
