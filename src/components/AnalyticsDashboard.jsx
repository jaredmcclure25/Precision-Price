/**
 * Precision Prices - Analytics Dashboard
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Activity,
  TrendingUp,
  Image,
  Clock,
  Eye,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw
} from 'lucide-react';
import { getAnalyticsDashboard } from '../analytics';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(7);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadAnalytics();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getAnalyticsDashboard(dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Last {dateRange} days</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analytics.totalUsers}
          icon={Users}
          color="blue"
          subtitle={`${analytics.totalGuests} guests`}
        />
        <MetricCard
          title="Total Sessions"
          value={analytics.totalSessions}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Analyses"
          value={analytics.totalAnalyses}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Images Uploaded"
          value={analytics.totalImages}
          icon={Image}
          color="orange"
        />
      </div>

      {/* Session Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          Session Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-600 text-sm">Avg. Session Duration</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(analytics.avgSessionDuration)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Registered Users</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Guest Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.totalGuests}</p>
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Activity Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.activityCounts || {}).map(([type, count]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-600 text-sm capitalize">
                {type.replace(/_/g, ' ')}
              </p>
              <p className="text-xl font-bold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Analyzed Items */}
      {analytics.topItems && analytics.topItems.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            Top Analyzed Items
          </h2>
          <div className="space-y-3">
            {analytics.topItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="text-gray-900">{item.name}</span>
                </div>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {item.count} analyses
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          Recent Activity
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {analytics.recentActivities && analytics.recentActivities.length > 0 ? (
            analytics.recentActivities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-600 text-sm">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function ActivityItem({ activity }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'image_upload':
        return <Image className="w-4 h-4" />;
      case 'page_view':
        return <Eye className="w-4 h-4" />;
      case 'session_start':
      case 'session_end':
        return <Activity className="w-4 h-4" />;
      default:
        return <MousePointer className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'analysis':
        return 'bg-blue-100 text-blue-600';
      case 'image_upload':
        return 'bg-purple-100 text-purple-600';
      case 'page_view':
        return 'bg-gray-100 text-gray-600';
      case 'session_start':
        return 'bg-green-100 text-green-600';
      case 'session_end':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${getActivityColor(activity.activityType)}`}>
        {getActivityIcon(activity.activityType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">
          <span className="font-semibold capitalize">
            {activity.activityType.replace(/_/g, ' ')}
          </span>
          {activity.metadata?.itemName && (
            <span className="text-gray-600"> - {activity.metadata.itemName}</span>
          )}
        </p>
        <p className="text-xs text-gray-500">
          {activity.isGuest ? 'Guest' : activity.userEmail || 'User'}
          {' • '}
          {formatTime(activity.timestamp)}
        </p>
      </div>
      {activity.metadata?.imageCount && (
        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
          {activity.metadata.imageCount} images
        </span>
      )}
    </div>
  );
}
