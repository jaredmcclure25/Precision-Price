// src/pages/Insurance.jsx

import React from 'react';
import ProductHero from '../components/ProductHero';
import HowItWorks from '../components/HowItWorks';
import FeatureGrid from '../components/FeatureGrid';
import Testimonial from '../components/Testimonial';
import PricingCTA from '../components/PricingCTA';
import { verticals } from '../data/verticals';
import { CheckCircle } from 'lucide-react';

const Insurance = () => {
  const vertical = verticals.insurance;

  return (
    <div className="bg-slate-900 min-h-screen">
      <ProductHero vertical={vertical} />
      <FeatureGrid features={vertical.features} />
      <HowItWorks vertical={vertical} />

      {/* Use Cases Section */}
      <div className="bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Handle Any Claim Type</h2>
            <p className="text-xl text-slate-400">From routine claims to complex total losses</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {vertical.useCases.map((useCase, index) => (
              <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-8">
                <CheckCircle className="w-10 h-10 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">{useCase.title}</h3>
                <p className="text-slate-400">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Testimonial testimonial={vertical.testimonial} />
      <PricingCTA vertical={vertical} />
    </div>
  );
};

export default Insurance;
