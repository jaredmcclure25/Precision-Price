/**
 * CommunitySales Component
 * Shows recent sales from the community
 */

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign } from 'lucide-react';
import { getRecentCommunitySales } from '../lib/firestore';

const CommunitySales = ({ zipCode, maxItems = 8 }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const data = await getRecentCommunitySales(zipCode, maxItems);
        setSales(data);
      } catch (error) {
        console.error('Failed to load community sales:', error);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [zipCode, maxItems]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Recent Community Sales</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="py-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Recent Community Sales</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            No recent sales data yet. Sales will appear here as the community grows!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-gray-900">Recent Community Sales</h2>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg divide-y divide-gray-100">
        {sales.map((sale, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 hover:bg-gray-50 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {sale.category}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {sale.zipCode}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {sale.daysToSell} days to sell
                </span>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="font-bold text-green-600">
                {formatPrice(sale.price)}
              </div>
              <div className="text-xs text-gray-400">
                {formatTimeAgo(sale.soldAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {sales.length >= maxItems && (
        <div className="text-center mt-3">
          <button className="text-sm text-indigo-600 hover:underline">
            View all sales
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunitySales;
