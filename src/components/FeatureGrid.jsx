// src/components/FeatureGrid.jsx

import React from 'react';

const FeatureGrid = ({ features }) => {
  return (
    <div className="bg-slate-800 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need to Win
          </h2>
          <p className="text-xl text-slate-400">
            Built specifically for your workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-slate-900 border border-slate-700 rounded-xl p-8 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all"
            >
              <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureGrid;
