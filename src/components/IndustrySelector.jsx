/**
 * Precision Prices - Industry Selector Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState } from 'react';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';

// Industry options
const industryOptions = [
  { value: 'furniture_home', label: 'Furniture & Home Goods', icon: '🛋️', description: 'Couches, tables, decor, and household items' },
  { value: 'vintage_antiques', label: 'Vintage/Antiques/Collectibles', icon: '🏺', description: 'Antiques, collectibles, vintage items' },
  { value: 'contractor', label: 'Contractor/Construction Materials', icon: '🔨', description: 'Building materials, salvage, equipment' },
  { value: 'insurance_estate', label: 'Insurance/Estate/Liquidation', icon: '📋', description: 'Claims, estate sales, liquidation' },
  { value: 'personal', label: 'Just browsing/personal items', icon: '🛒', description: 'Personal selling, general items' }
];

export default function IndustrySelector() {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateUserProfile, userProfile } = useAuth();

  const handleComplete = async () => {
    if (!selectedIndustry) {
      setError('Please select your industry');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await updateUserProfile({ industry: selectedIndustry });
    } catch (err) {
      console.error('Error updating industry:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {userProfile?.displayName || 'there'}!
          </h1>
          <p className="text-slate-400">
            One quick question to personalize your experience
          </p>
        </div>

        <h2 className="text-xl font-semibold text-white mb-4">What do you sell?</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-8">
          {industryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedIndustry(option.value)}
              disabled={loading}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                selectedIndustry === option.value
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
              }`}
            >
              <span className="text-3xl">{option.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-white">{option.label}</div>
                <div className="text-sm text-slate-400">{option.description}</div>
              </div>
              {selectedIndustry === option.value && (
                <Check className="w-6 h-6 text-emerald-500" />
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleComplete}
          disabled={loading || !selectedIndustry}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
