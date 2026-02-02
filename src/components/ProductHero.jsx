// src/components/ProductHero.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProductHero = ({ vertical }) => {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium">
              {vertical.badge}
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              {vertical.headline}
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed">
              {vertical.subheadline}
            </p>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-6">
              {vertical.stats.map((stat, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/app"
                className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Sign Up for Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="group px-8 py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>See How It Works</span>
              </a>
            </div>
          </div>

          {/* Right: Video Embed */}
          <div className="lg:pl-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group">
              {vertical.videoUrl ? (
                <div className="aspect-video">
                  <iframe
                    src={vertical.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/80 transition-colors">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-500/30 transition-colors">
                    <Play className="w-10 h-10 text-emerald-400 fill-emerald-400" />
                  </div>
                  <div className="text-white font-medium text-lg">Video Coming Soon</div>
                  <div className="text-slate-400 text-sm mt-2">See how it works</div>
                </div>
              )}
            </div>

            {/* Video Caption */}
            <p className="text-sm text-slate-400 mt-4 text-center">
              See how {vertical.name} teams use PrecisionPrices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHero;
