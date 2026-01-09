/**
 * Precision Prices - Feedback Analytics Dashboard
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 *
 * Visualize feedback data and pricing insights
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ThumbsUp, Calendar, DollarSign, Users, Loader2 } from 'lucide-react';
import { getRecentFeedback, calculateFeedbackStats } from '../feedback';

export default function FeedbackDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    loadFeedbackData();
  }, [timeRange]);

  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      const feedback = await getRecentFeedback(timeRange, 200);
      const aggregatedStats = calculateFeedbackStats(feedback);

      setFeedbackList(feedback);
      setStats(aggregatedStats);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!stats || stats.totalCount === 0) {
    return (
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Feedback Data Yet</h3>
          <p className="text-gray-600">Start collecting feedback from users to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Feedback Analytics</h2>
            <p className="text-gray-600 mt-1">Insights from user feedback and transaction data</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-4 py-2 rounded-lg ${timeRange === 7 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-4 py-2 rounded-lg ${timeRange === 30 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`px-4 py-2 rounded-lg ${timeRange === 90 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              90 Days
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-8 h-8 text-blue-600" />}
            value={stats.totalCount}
            label="Total Feedback"
            color="blue"
          />
          <StatCard
            icon={<ThumbsUp className="w-8 h-8 text-green-600" />}
            value={stats.priceAccuracy ? `${stats.priceAccuracy}%` : 'N/A'}
            label="Price Accuracy"
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-8 h-8 text-purple-600" />}
            value={stats.soldCount}
            label="Items Sold"
            color="purple"
          />
          <StatCard
            icon={<Calendar className="w-8 h-8 text-orange-600" />}
            value={stats.avgDaysToSell ? `${stats.avgDaysToSell} days` : 'N/A'}
            label="Avg Time to Sell"
            color="orange"
          />
        </div>
      </div>

      {/* Feedback Breakdown */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Feedback Breakdown</h3>
        <div className="space-y-4">
          <FeedbackBreakdown feedbackList={feedbackList} />
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Feedback</h3>
        <div className="space-y-3">
          {feedbackList.slice(0, 10).map((feedback, idx) => (
            <FeedbackItem key={idx} feedback={feedback} />
          ))}
        </div>
      </div>

      {/* Data Quality Insights */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">Data Quality Score</h3>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold">{stats.avgWeight}</div>
          <div>
            <p className="text-lg">Average Feedback Weight</p>
            <p className="text-sm opacity-90">Higher weights = more valuable feedback</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  const bgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    orange: 'bg-orange-50'
  };

  return (
    <div className={`${bgColors[color]} rounded-xl p-6`}>
      {icon}
      <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}

function FeedbackBreakdown({ feedbackList }) {
  const purposes = {};
  feedbackList.forEach(f => {
    purposes[f.purpose] = (purposes[f.purpose] || 0) + 1;
  });

  const total = feedbackList.length;

  return (
    <div className="space-y-3">
      {Object.entries(purposes).map(([purpose, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return (
          <div key={purpose}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 capitalize">
                {purpose.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeedbackItem({ feedback }) {
  const getIcon = (purpose) => {
    switch (purpose) {
      case 'price_accuracy':
        return <ThumbsUp className="w-4 h-4" />;
      case 'time_to_sell':
        return <Calendar className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? '✓ Positive' : '✗ Negative';
    }
    if (typeof value === 'object') {
      if (value.sold !== undefined) {
        return value.sold ? `Sold for $${value.finalPrice}` : 'Not sold';
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-indigo-600">
          {getIcon(feedback.purpose)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">
            {feedback.purpose.replace(/_/g, ' ')}
          </p>
          <p className="text-xs text-gray-600">
            {formatValue(feedback.value)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">
          Weight: {feedback.weight?.toFixed(2) || 'N/A'}
        </p>
        <p className="text-xs text-gray-400">
          {feedback.stage || 'pre_listing'}
        </p>
      </div>
    </div>
  );
}
