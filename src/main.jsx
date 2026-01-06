import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PasswordProtection from './PasswordProtection.jsx'
import { AuthProvider } from './AuthContext.jsx'
import AuthWrapper from './AuthWrapper.jsx'
import AnalyticsWrapper from './AnalyticsWrapper.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PasswordProtection>
      <AuthProvider>
        <AuthWrapper>
          <AnalyticsWrapper>
            <App />
          </AnalyticsWrapper>
        </AuthWrapper>
      </AuthProvider>
    </PasswordProtection>
  </StrictMode>,
)
