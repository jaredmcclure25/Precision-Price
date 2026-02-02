// src/components/PricingCTA.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

const PricingCTA = ({ vertical }) => {
  return (
    <div className="bg-slate-900 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-gradient-to-br from-emerald-900/30 to-yellow-900/20 rounded-2xl border border-emerald-500/30 p-12 text-center">
          <div className="inline-block px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium mb-6">
            Join Our Beta
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Join Our Team and Improve Your Business
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Be one of our first {vertical.name.toLowerCase()} partners. Try Precision Prices for free and help shape the future of AI-powered pricing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="group px-10 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-lg rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Sign Up for Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCTA;
