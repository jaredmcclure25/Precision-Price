/**
 * Precision Prices - Welcome Dashboard Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
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
  const industryName = industryNames[userProfile?.industry] || 'your items';
  const tip = industryTips[userProfile?.industry] || 'Take clear, well-lit photos for best results';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Welcome to Precision Prices
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Hi, {userProfile?.displayName || 'there'}!
        </h1>
        <p className="text-xl text-slate-400">
          Ready to get AI-powered pricing for {industryName.toLowerCase()}?
        </p>
      </div>

      {/* Primary CTA - Upload First Photo */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white text-center mb-8 shadow-lg shadow-emerald-500/20">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Upload className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Upload Your First Photo</h2>
        <p className="text-emerald-100 mb-6 max-w-md mx-auto">
          Get an instant AI-powered price recommendation in seconds. Just snap a photo of any item you want to sell.
        </p>
        <button
          onClick={onStartAnalysis}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <Camera className="w-5 h-5" />
          Start Your First Analysis
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Tip */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold mb-1">Pro Tip for {industryName}</h3>
            <p className="text-slate-400 text-sm">{tip}</p>
          </div>
        </div>
      </div>

      {/* Industry-Specific Tool Recommendations */}
      <IndustryToolRecommendations industry={userProfile?.industry} />

      {/* What You'll Get Section */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-white mb-6 text-center">What You'll Get</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Market-Based Pricing</h4>
            <p className="text-slate-400 text-sm">AI analyzes real marketplace data to give you accurate price ranges</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Smart Insights</h4>
            <p className="text-slate-400 text-sm">Get demand levels, best platforms, and timing recommendations</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <History className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="text-white font-semibold mb-2">Pricing History</h4>
            <p className="text-slate-400 text-sm">Track all your analyses and see how your pricing evolves</p>
          </div>
        </div>
      </div>

      {/* Learning Resources */}
      <div className="mt-12 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-emerald-400" />
          Quick Start Guide
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
            <div>
              <div className="text-white font-medium">Take a Photo</div>
              <div className="text-slate-400 text-sm">Snap or upload a photo of your item</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <div>
              <div className="text-white font-medium">Add Details</div>
              <div className="text-slate-400 text-sm">Enter condition and location</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <div className="text-white font-medium">Get AI Analysis</div>
              <div className="text-slate-400 text-sm">Receive price range and insights</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
            <div>
              <div className="text-white font-medium">List & Sell</div>
              <div className="text-slate-400 text-sm">Use the suggested price to sell faster</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
