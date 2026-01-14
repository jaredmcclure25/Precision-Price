import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import AuthWrapper from './AuthWrapper.jsx'
import AnalyticsWrapper from './AnalyticsWrapper.jsx'
import ListingPage from './pages/ListingPage.jsx'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import DataDeletion from './pages/DataDeletion.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/data-deletion" element={<DataDeletion />} />
          <Route path="/*" element={
            <AuthWrapper>
              <AnalyticsWrapper>
                <Routes>
                  <Route path="/" element={<App />} />
                  <Route path="/item/:listingId" element={<ListingPage />} />
                </Routes>
              </AnalyticsWrapper>
            </AuthWrapper>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
