import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PasswordProtection from './PasswordProtection.jsx'
import { AuthProvider } from './AuthContext.jsx'
import AuthWrapper from './AuthWrapper.jsx'
import AnalyticsWrapper from './AnalyticsWrapper.jsx'
import ListingPage from './pages/ListingPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PasswordProtection>
        <AuthProvider>
          <AuthWrapper>
            <AnalyticsWrapper>
              <Routes>
                <Route path="/" element={<App />} />
                <Route path="/item/:listingId" element={<ListingPage />} />
              </Routes>
            </AnalyticsWrapper>
          </AuthWrapper>
        </AuthProvider>
      </PasswordProtection>
    </BrowserRouter>
  </StrictMode>,
)
