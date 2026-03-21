/**
 * Precision Prices - Main Entry Point
 * Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

// Marketing Pages
import AppB2B from './AppB2B.jsx'
import Home from './pages/Home.jsx'
import WidgetPage from './pages/WidgetPage.jsx'

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
import BulkPricingPage from './pages/BulkPricingPage.jsx'
import SaleReviewPage from './pages/SaleReviewPage.jsx'
import PublishSalePage from './pages/PublishSalePage.jsx'
import SquareConnectPage from './pages/SquareConnectPage.jsx'
import SalesListPage from './pages/SalesListPage.jsx'
import CreateSalePage from './pages/CreateSalePage.jsx'
import SaleAlbumPage from './pages/SaleAlbumPage.jsx'
import RoomDetailPage from './pages/RoomDetailPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Marketing Pages (Public) */}
            <Route element={<AppB2B />}>
              <Route path="/" element={<Home />} />
              {/* Redirect old vertical pages to home */}
              <Route path="/junk-removal" element={<Navigate to="/" replace />} />
              <Route path="/contractors" element={<Navigate to="/" replace />} />
              <Route path="/insurance" element={<Navigate to="/" replace />} />
              <Route path="/retail" element={<Navigate to="/" replace />} />
              <Route path="/demo" element={<Navigate to="/app" replace />} />
              <Route path="/pricing" element={<Navigate to="/" replace />} />
            </Route>

            {/* Embeddable Widget (Public, no auth, no navbar/footer) */}
            <Route path="/widget/:businessId" element={<WidgetPage />} />

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
                    <Route path="/bulk" element={<BulkPricingPage />} />
                    <Route path="/sales" element={<SalesListPage />} />
                    <Route path="/sale/new" element={<CreateSalePage />} />
                    <Route path="/sale/:saleId" element={<SaleAlbumPage />} />
                    <Route path="/sale/:saleId/room/:roomId" element={<RoomDetailPage />} />
                    <Route path="/sale/:saleId/publish" element={<PublishSalePage />} />
                    <Route path="/sale/:saleId/review" element={<SaleReviewPage />} />
                    <Route path="/settings/square" element={<SquareConnectPage />} />
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
