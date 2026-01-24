/**
 * TrendingItems Component
 * Shows hot-selling categories in the user's area
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { getTrendingByZip } from '../lib/firestore';

const TrendingItems = ({ zipCode, onCategoryClick }) => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      if (!zipCode || zipCode.length !== 5) {
        setTrending([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getTrendingByZip(zipCode, 6);
        setTrending(data);
      } catch (error) {
        console.error('Failed to load trending:', error);
        setTrending([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, [zipCode]);

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}k`;
    }
    return `$${Math.round(price)}`;
  };

  const getDemandLevel = (soldListings) => {
    if (soldListings >= 20) return { label: 'Hot', color: 'text-red-500', bg: 'bg-red-50' };
    if (soldListings >= 10) return { label: 'Warm', color: 'text-orange-500', bg: 'bg-orange-50' };
    if (soldListings >= 5) return { label: 'Active', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { label: 'Growing', color: 'text-blue-500', bg: 'bg-blue-50' };
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Trending in {zipCode || 'your area'}</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-40 h-32 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!zipCode || trending.length === 0) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Trending in your area</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {!zipCode
              ? 'Enter your ZIP code to see what\'s trending'
              : 'No trending data yet for this area. Be the first to contribute!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h2 className="text-lg font-bold text-gray-900">Trending in {zipCode}</h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {trending.map((item, idx) => {
          const demand = getDemandLevel(item.soldListings);
          return (
            <button
              key={idx}
              onClick={() => onCategoryClick && onCategoryClick(item.category)}
              className="flex-shrink-0 w-44 bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${demand.bg} ${demand.color}`}>
                  {demand.label}
                </span>
                {idx === 0 && <span className="text-xs">#{idx + 1}</span>}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                {item.category}
              </h3>
              <div className="text-xl font-bold text-indigo-600">
                {formatPrice(item.avgSoldPrice)}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>{item.soldListings} sold</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingItems;
