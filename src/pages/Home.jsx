// src/pages/Home.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, BarChart3, Play, Check, Sparkles } from 'lucide-react';
import InteractiveDemo from '../components/InteractiveDemo';

const Home = () => {
  const industries = [
    {
      icon: '🚛',
      title: 'Junk Removal',
      description: 'Know what to charge before you arrive. Avoid wasted trips and maximize your workflow.',
      stat: 'Eliminate wasted trips',
      link: '/junk-removal',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: '🔨',
      title: 'Contractors',
      description: 'Get project estimates from customer photos. Quote accurately before visiting the site.',
      stat: 'Demo to Dollars',
      link: '/contractors',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: '📋',
      title: 'Insurance',
      description: 'Get fair market valuations using AI. Build credibility with defensible, data-backed quotes.',
      stat: 'Faster Assessments',
      link: '/insurance',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: '🏺',
      title: 'Retail & Antiques',
      description: 'Price with confidence using AI-powered market analysis.',
      stat: 'Sell Smarter',
      link: '/retail',
      gradient: 'from-yellow-500 to-yellow-600'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Fast Assessment',
      description: 'Get AI-powered pricing assessment quickly. No manual research required.'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is encrypted and protected. Built with security in mind.'
    },
    {
      icon: BarChart3,
      title: 'Marketplace Data',
      description: 'AI-powered analysis based on real marketplace pricing data.'
    },
    {
      icon: Sparkles,
      title: 'Easy to Use',
      description: 'Simple interface designed for busy professionals. Upload photos and get results.'
    }
  ];

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Stop Guessing.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
                Start Pricing Right.
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-300 mb-12 leading-relaxed">
              Your Pricing Co-Pilot powered by AI and marketplace data.
              <br className="hidden sm:block" />
              Built for junk removal, contractors, insurance, and resellers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/app"
                className="group px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-lg rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Sign Up for Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#demo"
                className="group px-10 py-5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-lg rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>See How It Works</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div id="demo" className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              See How It Works
            </h2>
            <p className="text-xl text-slate-400">
              Explore real pricing examples - no login required
            </p>
          </div>

          <InteractiveDemo />

          <div className="text-center mt-12">
            <Link
              to="/app"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
            >
              <span>Try It Yourself - Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Why It Works Section */}
      <div className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-8 h-8 text-emerald-400" />
                <span className="text-4xl font-bold text-white">Fast</span>
              </div>
              <p className="text-slate-400">Results in seconds</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BarChart3 className="w-8 h-8 text-yellow-400" />
                <span className="text-4xl font-bold text-white">AI-Powered</span>
              </div>
              <p className="text-slate-400">Market-based analysis</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-8 h-8 text-emerald-400" />
                <span className="text-4xl font-bold text-white">Free</span>
              </div>
              <p className="text-slate-400">No credit card needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Reversal / Trust Section */}
      <div className="bg-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <Shield className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Free Forever Plan</h3>
            <p className="text-slate-300 mb-4">No credit card required. Get started in 30 seconds.</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>10 free analyses/month</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Full AI-powered insights</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Industry Cards */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Built for Your Industry
            </h2>
            <p className="text-xl text-slate-400">
              Choose your industry for your specific needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {industries.map((industry, index) => (
              <Link
                key={index}
                to={industry.link}
                className="group bg-slate-800 border border-slate-700 rounded-2xl p-8 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="text-6xl">{industry.icon}</span>
                  <div className={`px-4 py-2 bg-gradient-to-r ${industry.gradient} rounded-full text-white text-sm font-medium`}>
                    {industry.stat}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {industry.title}
                </h3>
                <p className="text-slate-400 mb-4">
                  {industry.description}
                </p>
                <div className="flex items-center text-emerald-400 font-medium">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-slate-800 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Simple. Powerful. Professional.
            </h2>
            <p className="text-xl text-slate-400">
              Built for busy professionals who need results fast
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
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Early Adopter Invitation */}
      <div className="bg-gradient-to-br from-emerald-900/30 via-slate-900 to-yellow-900/20 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-8 md:p-12 text-center">
            <div className="inline-block px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium mb-6">
              Limited Beta Access
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Be One of Our First Partners
            </h2>
            <p className="text-lg text-slate-300 mb-6 max-w-2xl mx-auto">
              We're looking for businesses to join our beta program. Try Precision Prices for free and help shape the future of AI-powered pricing. Early adopters get exclusive founding member benefits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>Join the Beta - It's Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Join Precision Prices to Scale Your Business
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Start using AI-powered pricing today. Sign up for free.
          </p>
          <Link
            to="/app"
            className="group inline-flex items-center space-x-2 px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-lg rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105"
          >
            <span>Sign Up for Free</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
