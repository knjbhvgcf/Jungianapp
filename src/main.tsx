import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { EditModeProvider } from './lib/editMode.tsx'
import { migrateQuizStorage } from './lib/storage'
import './index.css'

if (window.location.hostname === 'www.jungology.com') {
  const { pathname, search, hash } = window.location
  window.location.replace(`https://jungology.com${pathname}${search}${hash}`)
} else {
  migrateQuizStorage()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <EditModeProvider>
        <App />
      </EditModeProvider>
    </BrowserRouter>
  </StrictMode>,
)
