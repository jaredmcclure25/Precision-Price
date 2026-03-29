/**
 * Precision Prices - Welcome Dashboard Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Play, BookOpen, ArrowRight, Sparkles, TrendingUp, History, Camera } from 'lucide-react';
import IndustryToolRecommendations from './IndustryToolRecommendations';

// Industry display names
const industryNames = {
  furniture_home: 'Furniture & Home Goods',
  vintage_antiques: 'Vintage & Antiques',
  contractor: 'Contractor Materials',
  insurance_estate: 'Insurance & Estate',
  personal: 'Personal Items'
};

// Quick tips based on industry
const industryTips = {
  furniture_home: 'Take photos in good lighting to showcase furniture condition',
  vintage_antiques: 'Include close-ups of maker marks, stamps, or signatures',
  contractor: 'Show all included pieces and any wear or damage clearly',
  insurance_estate: 'Document all angles for comprehensive valuation',
  personal: 'Clean items and use neutral backgrounds for best results'
};

export default function WelcomeDashboard({ userProfile, onStartAnalysis }) {
  const navigate = useNavigate();
  const tip = industryTips[userProfile?.industry] || 'Take clear, well-lit photos for best results';

  return (
    <div className="space-y-4">
      {/* Quick Price Check CTA */}
      <button
        onClick={onStartAnalysis}
        className="w-full flex items-center gap-3 px-4 py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl transition-colors text-left"
      >
        <Camera className="w-5 h-5 text-slate-300 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-white font-medium text-sm">Price a single item</div>
          <div className="text-slate-400 text-xs">Upload a photo, get an instant AI estimate</div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
}
