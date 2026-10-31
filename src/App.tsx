import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Admin } from './pages/Admin'
import { Clarify } from './pages/Clarify'
import { Compatibility } from './pages/Compatibility'
import { Dossier } from './pages/Dossier'
import { GuidePage, GuidesIndex } from './pages/Guide'
import { Home, TestLanding } from './pages/Home'
import { Legal } from './pages/Legal'
import { NotFound } from './pages/NotFound'
import { Quiz } from './pages/Quiz'
import { Results } from './pages/Results'
import { TypePage, TypesIndex } from './pages/TypePage'
import { QUIZ_PATH, TEST_LANDING_PATH } from './lib/quizPath'
import { TYPE_IN_DEPTH_PATH } from './lib/unlock'
import { WORKSPACE_JOIN_PATH, WORKSPACE_KEEP_PATH, WORKSPACE_OFFERED, WORKSPACE_PATH } from './lib/workspace/offered'
import { WorkspaceHouse } from './pages/WorkspaceHouse'
import { WorkspaceJoin } from './pages/WorkspaceJoin'
import { WorkspaceKeep } from './pages/WorkspaceKeep'

function RedirectDossier() {
  const location = useLocation()
  return (
    <Navigate
      to={{ pathname: TYPE_IN_DEPTH_PATH, search: location.search, hash: location.hash }}
      replace
    />
  )
}

function slash(path: string, element: ReactElement) {
  const clean = path.replace(/\/+$/, '')
  return [
    <Route key={clean} path={clean} element={element} />,
    <Route key={`${clean}/`} path={`${clean}/`} element={element} />,
  ]
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        {slash(QUIZ_PATH, <Quiz />)}
        {slash(TEST_LANDING_PATH, <TestLanding />)}
        {slash('/clarify', <Clarify />)}
        {slash('/results', <Results />)}
        {slash(TYPE_IN_DEPTH_PATH, <Dossier />)}
        {slash('/dossier', <RedirectDossier />)}
        {slash('/compatibility', <Compatibility />)}
        {slash('/about', <About />)}
        {slash('/legal', <Legal />)}
        {slash('/guides', <GuidesIndex />)}
        {slash('/4-letter-code', <Navigate to="/four-letter-code" replace />)}
        {slash('/the-stack', <Navigate to="/function-stack" replace />)}
        {slash('/types', <TypesIndex />)}
        {slash('/types/:code', <TypePage />)}
        {slash('/admin', <Admin />)}
        {WORKSPACE_OFFERED
          ? [
              ...slash(WORKSPACE_PATH, <WorkspaceHouse />),
              ...slash(WORKSPACE_JOIN_PATH, <WorkspaceJoin />),
              ...slash(WORKSPACE_KEEP_PATH, <WorkspaceKeep />),
            ]
          : null}
        {slash('/:slug', <GuidePage />)}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
