/**
 * Bullseye Price Target Visualization
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Visual pricing target using dartboard metaphor:
 * - Outer ring (MIN): Easy sale, quick turnover
 * - Middle ring (OPTIMAL): Sweet spot, balanced price/time
 * - Center bullseye (MAX): Premium price, patient sale
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
      {/* Bullseye Target */}
      <div className="relative w-full aspect-square max-w-md mx-auto mb-8">
        {/* SVG Bullseye */}
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {/* Outer ring (MIN) - Light emerald, easiest to hit */}
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="#10b981"
            fillOpacity="0.15"
            stroke="#10b981"
            strokeWidth="3"
            className="transition-all duration-300"
          />

          {/* Middle ring (OPTIMAL) - Medium emerald with pulsing animation */}
          <circle
            cx="200"
            cy="200"
            r="120"
            fill="#059669"
            fillOpacity="0.3"
            stroke="#059669"
            strokeWidth="4"
            className="animate-pulse transition-all duration-300"
          />

          {/* Center bullseye (MAX) - Dark emerald with gold accent */}
          <circle
            cx="200"
            cy="200"
            r="60"
            fill="#047857"
            fillOpacity="0.5"
            stroke="#f59e0b"
            strokeWidth="4"
            className="transition-all duration-300"
          />

          {/* Center dot */}
          <circle
            cx="200"
            cy="200"
            r="8"
            fill="#f59e0b"
            className="transition-all duration-300"
          />

          {/* Price labels */}
          {/* MIN price (outer ring) - positioned in outer band */}
          <text
            x="200"
            y="50"
            textAnchor="middle"
            className="fill-emerald-600 font-bold"
            style={{ fontSize: '20px' }}
          >
            ${min}
          </text>
          <text
            x="200"
            y="68"
            textAnchor="middle"
            className="fill-emerald-600 font-medium"
            style={{ fontSize: '11px' }}
          >
            Quick Sale
          </text>

          {/* OPTIMAL price (middle ring) - positioned in middle band */}
          <text
            x="200"
            y="195"
            textAnchor="middle"
            className="fill-emerald-700 font-bold"
            style={{ fontSize: '28px' }}
          >
            ${optimal}
          </text>
          <text
            x="200"
            y="218"
            textAnchor="middle"
            className="fill-emerald-700 font-semibold"
            style={{ fontSize: '13px' }}
          >
            Sweet Spot
          </text>

          {/* MAX price (center bullseye) - positioned at bottom */}
          <text
            x="200"
            y="345"
            textAnchor="middle"
            className="fill-emerald-800 font-bold"
            style={{ fontSize: '20px' }}
          >
            ${max}
          </text>
          <text
            x="200"
            y="363"
            textAnchor="middle"
            className="fill-emerald-800 font-medium"
            style={{ fontSize: '11px' }}
          >
            Premium
          </text>
        </svg>

        {/* Legend icons - positioned outside and to the right */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-4 bg-white rounded-lg shadow-md p-3 text-xs space-y-2 border border-gray-200">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="whitespace-nowrap">Quick</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span className="whitespace-nowrap">Balanced</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <span className="whitespace-nowrap">Maximum</span>
          </div>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
