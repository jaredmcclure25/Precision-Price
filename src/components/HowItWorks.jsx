// src/components/HowItWorks.jsx

import React from 'react';
import { Upload, Brain, FileText, TrendingUp } from 'lucide-react';

const HowItWorks = ({ vertical }) => {
  const steps = [
    {
      icon: Upload,
      title: 'Upload Photos',
      description: 'Snap pictures of items or upload existing photos. Our AI handles the rest.',
      color: 'from-emerald-500 to-cyan-400'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Advanced computer vision identifies items, assesses condition, and checks market data.',
      color: 'from-purple-500 to-pink-400'
    },
    {
      icon: FileText,
      title: 'Get Report',
      description: `Receive a professional ${vertical.reportType} report tailored to your industry.`,
      color: 'from-orange-500 to-yellow-400'
    },
    {
      icon: TrendingUp,
      title: 'Price with Confidence',
      description: vertical.outcome,
      color: 'from-green-500 to-emerald-400'
    }
  ];

  return (
    <div className="bg-slate-900 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-slate-400">
            Get accurate pricing in 4 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line (Desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent -z-10" />
                )}

                <div className="relative bg-slate-800 border border-slate-700 rounded-xl p-8 hover:border-emerald-500/50 transition-all h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.color} rounded-lg flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
