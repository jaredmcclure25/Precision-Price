/**
 * Precision Prices - Industry Tool Recommendations Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { Package, Info, Shield, TrendingUp, Calculator, Clipboard, List, FileText, Zap, Globe, Boxes, Wrench } from 'lucide-react';

// Tools configuration by industry
const toolsByIndustry = {
  furniture_home: {
    title: 'Recommended for Furniture & Home Goods',
    icon: '🛋️',
    tools: [
      { name: 'Condition Guide', icon: Info, desc: 'Learn how condition affects furniture prices', available: true },
      { name: 'Room Set Pricing', icon: Boxes, desc: 'Price multiple pieces as a set', available: true },
      { name: 'Style Identifier', icon: TrendingUp, desc: 'Identify furniture styles and eras', available: false, comingSoon: true },
    ]
  },
  vintage_antiques: {
    title: 'Recommended for Vintage & Antiques',
    icon: '🏺',
    tools: [
      { name: 'Authentication Tips', icon: Shield, desc: 'Verify authenticity markers', available: true },
      { name: 'Collector Demand', icon: TrendingUp, desc: 'See what collectors are seeking', available: true },
      { name: 'Era Identifier', icon: Info, desc: 'Identify time periods and styles', available: false, comingSoon: true },
    ]
  },
  contractor: {
    title: 'Recommended for Contractors',
    icon: '🔨',
    tools: [
      { name: 'Salvage Calculator', icon: Calculator, desc: 'Value salvaged materials by weight/volume', available: true },
      { name: 'Material Estimator', icon: Clipboard, desc: 'Estimate project material values', available: true },
      { name: 'Scrap Pricing', icon: Wrench, desc: 'Current scrap metal and material rates', available: false, comingSoon: true },
    ]
  },
  insurance_estate: {
    title: 'Recommended for Insurance & Estate',
    icon: '📋',
    tools: [
      { name: 'Inventory Builder', icon: List, desc: 'Create comprehensive item inventories', available: true },
      { name: 'Report Generator', icon: FileText, desc: 'Generate professional valuation reports', available: true },
      { name: 'Depreciation Calculator', icon: Calculator, desc: 'Calculate item depreciation over time', available: false, comingSoon: true },
    ]
  },
  personal: {
    title: 'Recommended for You',
    icon: '🛒',
    tools: [
      { name: 'Quick Sell Guide', icon: Zap, desc: 'Tips for faster sales', available: true },
      { name: 'Platform Chooser', icon: Globe, desc: 'Best marketplace for your item type', available: true },
      { name: 'Bulk Lister', icon: Package, desc: 'List multiple items at once', available: false, comingSoon: true },
    ]
  }
};

// Universal tools available to everyone
const universalTools = [
  { name: 'Price Analyzer', icon: TrendingUp, desc: 'AI-powered pricing analysis', available: true, core: true },
  { name: 'Market Trends', icon: TrendingUp, desc: 'Local marketplace demand data', available: true },
  { name: 'Pricing History', icon: List, desc: 'Track all your past analyses', available: true },
];

export default function IndustryToolRecommendations({ industry }) {
  const industryConfig = toolsByIndustry[industry] || toolsByIndustry.personal;

  return (
    <div className="space-y-6">
      {/* Industry-Specific Tools */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{industryConfig.icon}</span>
          <h3 className="text-lg font-bold text-white">{industryConfig.title}</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {industryConfig.tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  tool.available
                    ? 'bg-slate-700/50 border-slate-600 hover:border-emerald-500/50 cursor-pointer transition-colors'
                    : 'bg-slate-800/50 border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tool.available ? 'bg-emerald-500/20' : 'bg-slate-700'
                  }`}>
                    <Icon className={`w-5 h-5 ${tool.available ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  {tool.comingSoon && (
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </div>
                <h4 className={`font-semibold mb-1 ${tool.available ? 'text-white' : 'text-slate-400'}`}>
                  {tool.name}
                </h4>
                <p className="text-sm text-slate-400">{tool.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Universal Tools */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Your Core Tools</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {universalTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <div
                key={index}
                className="p-4 rounded-lg bg-slate-700/30 border border-slate-600"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-white">{tool.name}</h4>
                </div>
                <p className="text-sm text-slate-400">{tool.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
