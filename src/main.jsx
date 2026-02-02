/**
 * Precision Prices - Main Entry Point
 * Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

// B2B Marketing Pages
import AppB2B from './AppB2B.jsx'
import Home from './pages/Home.jsx'
import JunkRemoval from './pages/JunkRemoval.jsx'
import Contractors from './pages/Contractors.jsx'
import Insurance from './pages/Insurance.jsx'
import Retail from './pages/Retail.jsx'

// Original App & Auth
import App from './App.jsx'
import { AuthProvider } from './AuthContext.jsx'
import AuthWrapper from './AuthWrapper.jsx'
import AnalyticsWrapper from './AnalyticsWrapper.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ListingPage from './pages/ListingPage.jsx'
import ForgotPasswordPage from './ForgotPasswordPage.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import DataDeletion from './pages/DataDeletion.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* B2B Marketing Pages (Public) */}
            <Route element={<AppB2B />}>
              <Route path="/" element={<Home />} />
              <Route path="/junk-removal" element={<JunkRemoval />} />
              <Route path="/contractors" element={<Contractors />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/retail" element={<Retail />} />
              {/* Redirect demo to app */}
              <Route path="/demo" element={<Navigate to="/app" replace />} />
              {/* Redirect pricing to home (hidden but accessible) */}
              <Route path="/pricing" element={<Navigate to="/" replace />} />
            </Route>

            {/* Legal & Auth Pages */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/data-deletion" element={<DataDeletion />} />

            {/* Pricing Tool App (Authenticated) */}
            <Route path="/app/*" element={
              <AuthWrapper>
                <AnalyticsWrapper>
                  <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/marketplace" element={<MarketplacePage />} />
                    <Route path="/item/:listingId" element={<ListingPage />} />
                  </Routes>
                </AnalyticsWrapper>
              </AuthWrapper>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
