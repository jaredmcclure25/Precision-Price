// src/components/Testimonial.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';
import { Quote } from 'lucide-react';

const Testimonial = ({ testimonial }) => {
  // Don't render if no testimonial
  if (!testimonial || !testimonial.quote) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-900/30 via-slate-900 to-yellow-900/20 py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-12">
          <Quote className="absolute top-8 left-8 w-12 h-12 text-emerald-500/20" />

          <div className="relative">
            <blockquote className="text-2xl lg:text-3xl text-white font-medium mb-8 leading-relaxed">
              "{testimonial.quote}"
            </blockquote>

            <div className="flex items-center space-x-4">
              {testimonial.image && (
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-16 h-16 rounded-full border-2 border-emerald-500"
                />
              )}
              <div>
                <div className="text-white font-semibold text-lg">
                  {testimonial.author}
                </div>
                <div className="text-emerald-400">
                  {testimonial.company}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
