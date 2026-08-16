import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { About } from './pages/About'
import { Admin } from './pages/Admin'
import { Clarify } from './pages/Clarify'
import { Compatibility } from './pages/Compatibility'
import { Dossier } from './pages/Dossier'
import { GuidePage, GuidesIndex } from './pages/Guide'
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Quiz } from './pages/Quiz'
import { Results } from './pages/Results'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/clarify" element={<Clarify />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dossier" element={<Dossier />} />
        <Route path="/compatibility" element={<Compatibility />} />
        <Route path="/about" element={<About />} />
        <Route path="/guides" element={<GuidesIndex />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/:slug" element={<GuidePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
