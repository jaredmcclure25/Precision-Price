/**
 * Precision Prices - Freemium Pricing Table Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    highlighted: false,
    features: [
      { name: '10 price analyses per month', included: true },
      { name: 'Up to 3 photos per item', included: true },
      { name: 'AI-powered pricing insights', included: true },
      { name: 'Local market trends', included: true },
      { name: '30-day pricing history', included: true },
      { name: 'Industry-specific tools', included: false },
      { name: 'Bulk uploads', included: false },
      { name: 'Export reports', included: false },
      { name: 'Priority support', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/app'
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For power sellers & professionals',
    highlighted: true,
    badge: 'Most Popular',
    features: [
      { name: 'Unlimited price analyses', included: true },
      { name: 'Up to 5 photos per item', included: true },
      { name: 'AI-powered pricing insights', included: true },
      { name: 'Local market trends', included: true },
      { name: 'Unlimited pricing history', included: true },
      { name: 'Industry-specific tools', included: true },
      { name: 'Bulk uploads', included: true },
      { name: 'Export reports (PDF/CSV)', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: false },
    ],
    cta: 'Start Pro Trial',
    ctaLink: '/app'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams & high-volume sellers',
    highlighted: false,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom AI training', included: true },
      { name: 'API access', included: true },
      { name: 'SLA guarantees', included: true },
      { name: 'On-premise deployment', included: true },
      { name: 'White-label options', included: true },
      { name: 'Volume discounts', included: true },
    ],
    cta: 'Contact Sales',
    ctaLink: '/app'
  }
];

export default function FreemiumPricingTable() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`relative rounded-2xl p-6 ${
            plan.highlighted
              ? 'bg-gradient-to-b from-emerald-900/50 to-slate-800 border-2 border-emerald-500'
              : 'bg-slate-800 border border-slate-700'
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-full">
                <Sparkles className="w-4 h-4" />
                {plan.badge}
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-4xl font-bold ${plan.highlighted ? 'text-emerald-400' : 'text-white'}`}>
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-slate-400">{plan.period}</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2">{plan.description}</p>
          </div>

          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                {feature.included ? (
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={feature.included ? 'text-slate-300' : 'text-slate-500'}>
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>

          <Link
            to={plan.ctaLink}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${
              plan.highlighted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
