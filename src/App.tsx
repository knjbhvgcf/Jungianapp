import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Admin } from './pages/Admin'
import { Clarify } from './pages/Clarify'
import { Compatibility } from './pages/Compatibility'
import { Dossier } from './pages/Dossier'
import { GuidePage, GuidesIndex } from './pages/Guide'
import { Home } from './pages/Home'
import { Legal } from './pages/Legal'
import { NotFound } from './pages/NotFound'
import { Quiz } from './pages/Quiz'
import { Results } from './pages/Results'
import { TypePage, TypesIndex } from './pages/TypePage'
import { TYPE_IN_DEPTH_PATH } from './lib/unlock'

function RedirectDossier() {
  const location = useLocation()
  return (
    <Navigate
      to={{ pathname: TYPE_IN_DEPTH_PATH, search: location.search, hash: location.hash }}
      replace
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/clarify" element={<Clarify />} />
        <Route path="/results" element={<Results />} />
        <Route path={TYPE_IN_DEPTH_PATH} element={<Dossier />} />
        <Route path={`${TYPE_IN_DEPTH_PATH}/`} element={<Dossier />} />
        <Route path="/dossier" element={<RedirectDossier />} />
        <Route path="/dossier/" element={<RedirectDossier />} />
        <Route path="/compatibility" element={<Compatibility />} />
        <Route path="/about" element={<About />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/guides" element={<GuidesIndex />} />
        <Route path="/types" element={<TypesIndex />} />
        <Route path="/types/:code" element={<TypePage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/:slug" element={<GuidePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
