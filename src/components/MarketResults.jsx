/**
 * MarketResults Component
 * Displays market data results for a given ZIP code
 */

import React from 'react';

const getConfidenceBadge = (confidence) => {
  const colors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-orange-100 text-orange-800',
  };
  return colors[confidence] || colors.low;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

export const MarketResults = ({ results, zipCode }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What's Selling in {zipCode}
        </h2>
        <p className="text-gray-600 mb-6">
          Based on {results.reduce((sum, r) => sum + r.soldListings, 0)} recent sales
        </p>

        <div className="grid gap-4">
          {results.map((item, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-lg p-5 hover:border-indigo-300 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {item.category}
                  </h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getConfidenceBadge(item.confidence)}`}>
                      {item.confidence.toUpperCase()} confidence
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {item.sampleSize} sales tracked
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Avg Price</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatPrice(item.avgSoldPrice)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Price Range</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPrice(item.priceRange.min)} - {formatPrice(item.priceRange.max)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Avg Days to Sell</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {Math.round(item.avgDaysToSell)} days
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Active Listings</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {item.activeListings} now
                  </div>
                </div>
              </div>

              {item.recentSales && item.recentSales.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-600 mb-2">
                    Recent Sales (Last 30 Days)
                  </div>
                  <div className="space-y-1">
                    {item.recentSales.slice(0, 3).map((sale, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span>{formatPrice(sale.price)}</span>
                        <span className="text-gray-400">
                          Sold in {sale.daysToSell} days
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketResults;
