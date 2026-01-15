/**
 * Price Range Visualization
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Visual pricing strategy using graduated pricing bars:
 * - MIN: Quick sale price (sell fast, lower profit)
 * - OPTIMAL: Sweet spot (recommended, balanced)
 * - MAX: Premium price (patient sale, highest profit)
 */

import React from 'react';
import { Target, TrendingUp, Zap, Award } from 'lucide-react';

export default function BullseyePriceTarget({ min, max, optimal, confidence = 70, locationData, dataCount = 0 }) {
  // Calculate confidence level message
  const getConfidenceMessage = () => {
    if (dataCount >= 10) {
      return { level: 'high', icon: '🎯', text: `High confidence based on ${dataCount} similar items sold` };
    } else if (dataCount >= 3) {
      return { level: 'medium', icon: '📊', text: `Based on ${dataCount} similar items + AI analysis` };
    } else {
      return { level: 'low', icon: '🤖', text: 'AI-powered estimate (be the first to report sale data!)' };
    }
  };

  const confidenceInfo = getConfidenceMessage();

  // Format location display with ZIP code
  const formatLocation = () => {
    if (!locationData) return null;

    const parts = [];
    if (locationData.city) parts.push(locationData.city);
    if (locationData.state) parts.push(locationData.state);
    if (locationData.zipCode) parts.push(locationData.zipCode);

    return parts.join(', ');
  };

  const locationDisplay = formatLocation();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Price Range Visualization */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-emerald-100 via-emerald-200 to-yellow-100 rounded-2xl p-8 shadow-lg">
          {/* Title */}
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Pricing Strategy</h3>
            <p className="text-sm text-gray-600">Choose your speed vs. profit tradeoff</p>
          </div>

          {/* Price Range Bar */}
          <div className="relative h-24 bg-white rounded-xl shadow-inner mb-6 overflow-hidden">
            {/* Gradient background showing price range */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-yellow-500 opacity-20"></div>

            {/* MIN marker */}
            <div className="absolute left-0 top-0 bottom-0 w-1/3 border-r-2 border-emerald-600 border-dashed flex items-center justify-center px-1">
              <div className="text-center">
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600 mx-auto mb-1" />
                <div className="text-lg sm:text-2xl font-bold text-emerald-700">${min}</div>
                <div className="text-[10px] sm:text-xs text-emerald-600 font-medium">Quick Sale</div>
              </div>
            </div>

            {/* OPTIMAL marker (highlighted) */}
            <div className="absolute left-1/3 right-1/3 top-0 bottom-0 border-x-2 border-emerald-700 bg-emerald-50 flex items-center justify-center animate-pulse px-1">
              <div className="text-center">
                <Target className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-700 mx-auto mb-1" />
                <div className="text-xl sm:text-3xl font-bold text-emerald-800">${optimal}</div>
                <div className="text-[10px] sm:text-sm text-emerald-700 font-semibold">BEST</div>
              </div>
            </div>

            {/* MAX marker */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 border-l-2 border-yellow-600 border-dashed flex items-center justify-center px-1">
              <div className="text-center">
                <Award className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-700 mx-auto mb-1" />
                <div className="text-lg sm:text-2xl font-bold text-yellow-800">${max}</div>
                <div className="text-[10px] sm:text-xs text-yellow-700 font-medium">Premium</div>
              </div>
            </div>
          </div>

          {/* Speed/Profit axis labels */}
          <div className="flex justify-between items-center text-xs text-gray-600 px-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Faster Sale</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Higher Profit</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* MIN card */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4 text-center">
          <Zap className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-700">${min}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Minimum</div>
          <div className="text-xs text-gray-600 mt-2">
            Sell within 1-3 days. Best for quick cash or clearing inventory.
          </div>
        </div>

        {/* OPTIMAL card */}
        <div className="bg-emerald-100 border-2 border-emerald-400 rounded-lg p-4 text-center ring-2 ring-emerald-300 ring-offset-2">
          <Target className="w-6 h-6 text-emerald-700 mx-auto mb-2" />
          <div className="text-3xl font-bold text-emerald-800">${optimal}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">RECOMMENDED</div>
          <div className="text-xs text-gray-700 mt-2">
            Sell within 1-2 weeks. Perfect balance of price and speed.
          </div>
        </div>

        {/* MAX card */}
        <div className="bg-gradient-to-br from-emerald-50 to-yellow-50 border-2 border-emerald-300 rounded-lg p-4 text-center">
          <Award className="w-6 h-6 text-emerald-800 mx-auto mb-2" />
          <div className="text-2xl font-bold text-emerald-800">${max}</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Maximum</div>
          <div className="text-xs text-gray-600 mt-2">
            Patient sale, 2-4 weeks. For premium buyers seeking quality.
          </div>
        </div>
      </div>

      {/* Confidence & Location Badge */}
      <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
        {/* Confidence Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Confidence Score</span>
            <span className="text-sm font-bold text-emerald-700">{confidence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                confidence >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                confidence >= 60 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                'bg-gradient-to-r from-emerald-300 to-emerald-400'
              }`}
              style={{ width: `${confidence}%` }}
            ></div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg">{confidenceInfo.icon}</span>
            <span className="text-xs text-gray-600">{confidenceInfo.text}</span>
          </div>
        </div>

        {/* Location Badge */}
        {locationDisplay && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
            <div className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {locationDisplay}
            </div>
            <span className="text-xs text-gray-500">Prices adjusted for your market</span>
          </div>
        )}
      </div>

      {/* Pricing Strategy Tip */}
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <strong className="text-blue-900">Pro Tip:</strong> List at ${optimal} and be willing to negotiate down to ${min}.
            This gives buyers room to feel like they got a deal while you maximize value.
          </div>
        </div>
      </div>
    </div>
  );
}
