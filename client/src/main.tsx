import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadCensus } from './lib/census.ts'

function start() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  // Pulse is one page that never changes its address, so the first load is the visit.
  loadCensus()
}

// Installed, the app opens on the splash screen (index.html, switched on by public/theme.js; written
// by development/plans/splash-rollout). iOS fades its launch image into the page as soon as the page
// has laid out, so the splash has to be on screen before the app's first render takes the main
// thread, or the fade goes through a blank white web view. App lifts it (splash:ready).
if (document.documentElement.classList.contains('splash')) {
  let started = false
  const once = () => {
    if (started) return
    started = true
    start()
  }
  requestAnimationFrame(() => setTimeout(once))
  setTimeout(once, 100)
} else {
  start()
}

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
