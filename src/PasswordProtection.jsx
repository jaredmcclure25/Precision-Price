/**
 * Precision Prices - Password Protection Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';

// CHANGE THIS PASSWORD TO YOUR DESIRED PASSWORD
const SITE_PASSWORD = 'pod26';

// Create context for site password logout
const SiteAuthContext = createContext();
export const useSiteAuth = () => useContext(SiteAuthContext);

export default function PasswordProtection({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const stored = await window.storage.get('auth_token');
      if (stored && stored.value === 'authenticated') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.log('Auth check failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password === SITE_PASSWORD) {
      // Store authentication
      try {
        await window.storage.set('auth_token', 'authenticated');
      } catch (e) {
        console.log('Failed to store auth:', e);
      }
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleLogout = async () => {
    try {
      await window.storage.remove('auth_token');
    } catch (e) {
      console.log('Failed to remove auth:', e);
    }
    setIsAuthenticated(false);
    setPassword('');
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Precision Prices</h1>
            <p className="text-gray-600">Enter password to access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Unlock Access
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <Shield className="w-4 h-4 inline mr-1" />
            Protected by password authentication
          </div>
        </div>
      </div>
    );
  }

  // Render children with context provider for site logout
  return (
    <SiteAuthContext.Provider value={{ logoutSite: handleLogout }}>
      {children}
    </SiteAuthContext.Provider>
  );
}
