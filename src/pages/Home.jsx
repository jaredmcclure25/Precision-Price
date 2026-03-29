// src/pages/Home.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, BarChart3, Check, Sparkles, Camera, Home as HomeIcon, ClipboardList } from 'lucide-react';

const Home = () => {
  const steps = [
    {
      number: '01',
      icon: Camera,
      title: 'Photograph Your Rooms',
      description: 'Take up to 4 photos of each room — wide shots, close-ups, or shelf details. No special equipment needed.',
      color: 'text-blue-400',
      bg: 'bg-blue-900/30 border-blue-700/50',
    },
    {
      number: '02',
      icon: Sparkles,
      title: 'AI Prices Every Item',
      description: 'Our AI identifies every sellable item in each photo and gives you Low, Target, and High price tiers for each one.',
      color: 'text-purple-400',
      bg: 'bg-purple-900/30 border-purple-700/50',
    },
    {
      number: '03',
      icon: ClipboardList,
      title: 'Organize, Review & Sell',
      description: 'Edit prices, remove items, add missed pieces, then publish your sale and track what sells.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-900/30 border-emerald-700/50',
    },
  ];

  const features = [
    {
      icon: HomeIcon,
      title: 'Room-by-Room Organization',
      description: 'Structure your sale by room — Living Room, Kitchen, Garage, and more. Every item knows where it lives.',
    },
    {
      icon: Zap,
      title: 'Instant AI Pricing',
      description: 'Claude AI analyzes market data to price every item with Low, Target, and High ranges in seconds.',
    },
    {
      icon: BarChart3,
      title: 'Track Every Outcome',
      description: 'Mark items as Sold, Unsold, or Passed. See your total revenue and accuracy scores after the sale.',
    },
    {
      icon: Shield,
      title: 'Free to Start',
      description: 'No credit card required. Start your first estate sale project today at no cost.',
    },
  ];

  return (
    <div className="bg-slate-900 min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium mb-8">
              AI-Powered Estate Sale Management
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Photograph Rooms.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                Price Everything.
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-300 mb-12 leading-relaxed">
              Take photos of each room and our AI identifies and prices every item automatically.
              <br className="hidden sm:block" />
              Run a faster, smarter, more profitable estate sale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/app/sales"
                className="group px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-lg rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Start New Estate Sale</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="group px-10 py-5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-lg rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>See How It Works</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>AI prices every item</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Free to start</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <div id="how-it-works" className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-400">
              From empty rooms to priced inventory in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className={`rounded-2xl p-8 border ${step.bg}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <span className={`text-4xl font-black ${step.color} opacity-40`}>{step.number}</span>
                    <div className={`w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/app/sales"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
            >
              <span>Get Started — It's Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Why Precision Prices ─────────────────────────────────── */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need to Run a Great Sale
            </h2>
            <p className="text-xl text-slate-400">
              Built for estate sale operators, downsizing families, and resellers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-yellow-400 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Free Plan Trust Section ──────────────────────────────── */}
      <div className="bg-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Free Forever Plan</h3>
            <p className="text-slate-300 mb-4">No credit card required. Get started in 30 seconds.</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Free estate sale projects</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>AI room scanning included</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main CTA ─────────────────────────────────────────────── */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Run Your Next Estate Sale?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Start your first sale project free. AI prices every item in minutes.
          </p>
          <Link
            to="/app/sales"
            className="group inline-flex items-center space-x-2 px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-lg rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105"
          >
            <span>Start New Estate Sale</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ── Quick Price Check (Secondary) ───────────────────────── */}
      <div className="bg-slate-800 py-16 border-t border-slate-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-medium mb-4">Just need to price one thing?</p>
          <h3 className="text-2xl font-bold text-white mb-3">Quick Price Check</h3>
          <p className="text-slate-400 mb-6">
            Upload a single photo and get an instant AI price estimate — no account needed.
          </p>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-lg font-medium transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Price a Single Item</span>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Home;
