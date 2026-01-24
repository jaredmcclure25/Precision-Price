/**
 * MarketplacePage Component
 * Main page for PrecisionPrices marketplace features
 */

import React from 'react';
import { useAuth } from '../hooks/useAuthAdapter';
import { LandingSearch } from '../components/LandingSearch';
import { Dashboard } from '../components/Dashboard';

const MarketplacePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading PrecisionPrices...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LandingSearch />;
};

export default MarketplacePage;
