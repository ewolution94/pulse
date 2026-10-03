import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadCensus } from './lib/census.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Pulse is one page that never changes its address, so the first load is the visit.
loadCensus()

// The offline shell (public/sw.js). Production only: in front of the dev
// server it would cache the very modules Vite is hot-replacing. Registered
// after `load` so it competes with nothing on the first paint.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // An unavailable worker costs the offline shell and nothing else.
    })
  })
}
