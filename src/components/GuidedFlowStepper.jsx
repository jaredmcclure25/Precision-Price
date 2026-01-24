/**
 * Guided Flow Stepper Component
 * Progressive step indicator for the pricing analysis flow
 *
 * Steps: Analyze → Pick Price → Track → Create Page
 */

import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 'analyze', label: 'Analyze', shortLabel: 'Analyze' },
  { id: 'pick-price', label: 'Pick Price', shortLabel: 'Price' },
  { id: 'track', label: 'Track Listing', shortLabel: 'Track' },
  { id: 'share', label: 'Create Page', shortLabel: 'Create' },
];

export default function GuidedFlowStepper({ currentStep, completedSteps = [], onStepClick }) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6 sticky top-4 z-40">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;
          const isClickable = isCompleted || isPast;

          return (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
              >
                {/* Circle/Check */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    isCurrent
                      ? 'text-indigo-600 font-bold'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`text-[10px] font-medium sm:hidden ${
                    isCurrent
                      ? 'text-indigo-600 font-bold'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.shortLabel}
                </span>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-1 sm:mx-2 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      index < currentIndex || completedSteps.includes(STEPS[index + 1]?.id)
                        ? 'bg-green-500 w-full'
                        : isCurrent
                        ? 'bg-indigo-400 w-1/2'
                        : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current step description */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600">
          {currentStep === 'analyze' && "Analysis complete! Now pick your pricing strategy."}
          {currentStep === 'pick-price' && "Choose a price tier that fits your selling timeline."}
          {currentStep === 'track' && "Save this listing to track performance and improve our AI."}
          {currentStep === 'share' && "Create a shareable listing page for Facebook Marketplace."}
        </p>
      </div>
    </div>
  );
}

export { STEPS };
