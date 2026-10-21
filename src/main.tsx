import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ReversePage } from '@/components/Reverse'
import { I18nProvider } from '@/lib/i18n'

// Tiny router: /reverse (under the /wuza/ base in production) is the amps-first page; everything else is the app.
const path = window.location.pathname.slice(import.meta.env.BASE_URL.length - 1).replace(/\/+$/, '')
const isReverse = path === '/reverse'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      {isReverse ? <ReversePage /> : <App />}
    </I18nProvider>
  </StrictMode>,
)
