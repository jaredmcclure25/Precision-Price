import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PasswordProtection from './PasswordProtection.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PasswordProtection>
      <App />
    </PasswordProtection>
  </StrictMode>,
)
