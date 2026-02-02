// src/pages/Pricing.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, HelpCircle } from 'lucide-react';

const Pricing = () => {
  const [billing, setBilling] = useState('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for solo operators and small teams',
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        '100 valuations per month',
        'Photo-based analysis',
        'Basic reports (PDF)',
        'Email support',
        'Mobile app access',
        '1 user seat'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      description: 'For growing businesses that need more power',
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        '500 valuations per month',
        'Advanced AI identification',
        'Detailed reports with comps',
        'Priority support',
        'CRM integrations',
        '5 user seats',
        'Bulk upload (50 items)',
        'Custom branding'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large teams with custom needs',
      monthlyPrice: null,
      annualPrice: null,
      features: [
        'Unlimited valuations',
        'API access',
        'White-label reports',
        'Dedicated account manager',
        'Custom integrations',
        'Unlimited users',
        'SSO / SAML',
        'SLA guarantee',
        'On-premise option'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'What counts as a valuation?',
      answer: 'Each item you submit for pricing analysis counts as one valuation. Bulk uploads count each item individually.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, all plans include a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'What integrations do you support?',
      answer: 'We integrate with Jobber, Housecall Pro, ServiceTitan, Xactimate, and more. Enterprise plans include custom integrations.'
    },
    {
      question: 'How accurate is the pricing?',
      answer: 'Our AI achieves 99% accuracy by analyzing real-time marketplace data from multiple sources including eBay, Facebook Marketplace, and local listings.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. No long-term contracts or cancellation fees.'
    }
  ];

  return (
    <div className="bg-slate-900 min-h-screen">
      {/* Hero */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Start free. Scale as you grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-slate-800 rounded-full p-1 mb-12">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billing === 'annual'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-slate-800 rounded-2xl p-8 border ${
                plan.popular
                  ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
                  : 'border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-emerald-500 to-cyan-400 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400">{plan.description}</p>
              </div>

              <div className="mb-8">
                {plan.monthlyPrice ? (
                  <>
                    <span className="text-5xl font-bold text-white">
                      ${billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                    </span>
                    <span className="text-slate-400">/month</span>
                    {billing === 'annual' && (
                      <div className="text-sm text-green-400 mt-1">
                        Billed annually (${plan.annualPrice * 12}/year)
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold text-white">Custom Pricing</span>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/demo"
                className={`w-full py-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-emerald-500/50'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-400">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <HelpCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-slate-400">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Still have questions?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Our team is here to help you find the perfect plan for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/demo"
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-cyan-400 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/50 transition-all"
            >
              Book a Demo
            </Link>
            <a
              href="mailto:hello@precisionprices.com"
              className="px-10 py-4 bg-slate-800 text-white rounded-lg font-medium border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
