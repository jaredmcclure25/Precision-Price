/**
 * Precision Prices - Interactive Demo Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Clock, MapPin, Tag } from 'lucide-react';

// Demo items with pre-loaded pricing analyses
const demoItems = [
  {
    id: 1,
    name: 'Mid-Century Modern Dresser',
    category: 'Furniture',
    condition: 'Good - Minor scratches',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
    priceRange: { min: 175, optimal: 275, max: 350 },
    confidence: 87,
    demandLevel: 'High',
    daysToSell: '5-10 days',
    insights: [
      'Mid-century modern furniture is trending in Austin market',
      'Similar dressers sold within 7 days at this price point',
      'Consider professional photos to maximize appeal'
    ]
  },
  {
    id: 2,
    name: 'iPhone 13 Pro 128GB',
    category: 'Electronics',
    condition: 'Like New - No scratches',
    location: 'Los Angeles, CA',
    image: 'https://images.unsplash.com/photo-1632633173522-47456de71b76?w=400&h=300&fit=crop',
    priceRange: { min: 425, optimal: 495, max: 575 },
    confidence: 94,
    demandLevel: 'Very High',
    daysToSell: '1-3 days',
    insights: [
      'High demand for used iPhones in LA metro area',
      'Include original box and accessories for premium pricing',
      'Post on multiple platforms for fastest sale'
    ]
  },
  {
    id: 3,
    name: 'Vintage Oak Dining Table',
    category: 'Antiques',
    condition: 'Excellent - Refinished',
    location: 'Chicago, IL',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=300&fit=crop',
    priceRange: { min: 450, optimal: 650, max: 850 },
    confidence: 82,
    demandLevel: 'Moderate',
    daysToSell: '14-21 days',
    insights: [
      'Vintage oak furniture commands premium in Chicago',
      'Highlight craftsmanship and solid wood construction',
      'Estate sales and antique groups may yield higher prices'
    ]
  },
  {
    id: 4,
    name: 'DeWalt Power Drill Set',
    category: 'Tools',
    condition: 'Good - Lightly used',
    location: 'Dallas, TX',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=300&fit=crop',
    priceRange: { min: 85, optimal: 120, max: 145 },
    confidence: 91,
    demandLevel: 'High',
    daysToSell: '3-7 days',
    insights: [
      'DeWalt brand commands strong resale value',
      'Include all original accessories and case',
      'Construction season increases demand'
    ]
  }
];

export default function InteractiveDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = demoItems[currentIndex];

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % demoItems.length);
  };

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + demoItems.length) % demoItems.length);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mb-8">
        {demoItems.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-emerald-500 w-8'
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          />
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left side - Item image and details */}
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-700">
            <div className="relative mb-6">
              <img
                src={currentItem.image}
                alt={currentItem.name}
                className="w-full h-64 object-cover rounded-xl"
              />
              <div className="absolute top-4 left-4 px-3 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full text-sm text-white">
                {currentItem.category}
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">{currentItem.name}</h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Tag className="w-4 h-4" />
                <span>{currentItem.condition}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{currentItem.location}</span>
              </div>
            </div>
          </div>

          {/* Right side - AI Analysis */}
          <div className="p-6 md:p-8 bg-slate-800/50">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white">AI Price Analysis</h4>
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                {currentItem.confidence}% Confidence
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-slate-900 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-slate-400 mb-1">Recommended Price</div>
                <div className="text-4xl font-bold text-emerald-400">
                  ${currentItem.priceRange.optimal}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div className="text-center">
                  <div className="text-slate-500">Quick Sale</div>
                  <div className="text-white font-semibold">${currentItem.priceRange.min}</div>
                </div>
                <div className="text-center">
                  <div className="text-slate-500">Premium</div>
                  <div className="text-white font-semibold">${currentItem.priceRange.max}</div>
                </div>
              </div>

              {/* Price bar visualization */}
              <div className="mt-4 relative h-2 bg-slate-700 rounded-full">
                <div
                  className="absolute h-full bg-gradient-to-r from-yellow-500 via-emerald-500 to-emerald-400 rounded-full"
                  style={{
                    left: '0%',
                    width: '100%'
                  }}
                />
                <div
                  className="absolute w-4 h-4 bg-white rounded-full -top-1 shadow-lg border-2 border-emerald-500"
                  style={{
                    left: `${((currentItem.priceRange.optimal - currentItem.priceRange.min) / (currentItem.priceRange.max - currentItem.priceRange.min)) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">Demand</span>
                </div>
                <div className="text-white font-semibold">{currentItem.demandLevel}</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Est. Time to Sell</span>
                </div>
                <div className="text-white font-semibold">{currentItem.daysToSell}</div>
              </div>
            </div>

            {/* Insights */}
            <div>
              <h5 className="text-sm font-semibold text-slate-300 mb-3">Market Insights</h5>
              <ul className="space-y-2">
                {currentItem.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-800 border-t border-slate-700">
          <button
            onClick={prevItem}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Previous</span>
          </button>

          <span className="text-slate-500 text-sm">
            {currentIndex + 1} of {demoItems.length} examples
          </span>

          <button
            onClick={nextItem}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
