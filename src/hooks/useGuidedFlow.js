/**
 * useGuidedFlow Hook
 * Manages step-by-step guided flow state, auto-scrolling, and step feedback tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const STEP_ORDER = ['analyze', 'pick-price', 'track', 'share'];

export default function useGuidedFlow(initialStep = 'analyze') {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(['analyze']); // analyze is done when results show
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [stepFeedback, setStepFeedback] = useState({}); // { stepId: { feedback data } }

  // Refs for auto-scrolling
  const stepRefs = useRef({});

  // Register a ref for a step section
  const registerStepRef = useCallback((stepId, ref) => {
    stepRefs.current[stepId] = ref;
  }, []);

  // Scroll to a specific step
  const scrollToStep = useCallback((stepId) => {
    const ref = stepRefs.current[stepId];
    if (ref?.current) {
      setTimeout(() => {
        ref.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }, 150);
    }
  }, []);

  // Complete a step and move to next
  const completeStep = useCallback((stepId, feedbackData = null) => {
    setCompletedSteps(prev =>
      prev.includes(stepId) ? prev : [...prev, stepId]
    );

    // Store feedback if provided
    if (feedbackData) {
      setStepFeedback(prev => ({
        ...prev,
        [stepId]: { ...feedbackData, completedAt: new Date().toISOString() }
      }));
    }

    // Move to next step
    const currentIndex = STEP_ORDER.indexOf(stepId);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      setCurrentStep(nextStep);
      scrollToStep(nextStep);
    }
  }, [scrollToStep]);

  // Skip a step and move to next
  const skipStep = useCallback((stepId, reason = 'skipped') => {
    setSkippedSteps(prev =>
      prev.includes(stepId) ? prev : [...prev, stepId]
    );

    setStepFeedback(prev => ({
      ...prev,
      [stepId]: { skipped: true, reason, skippedAt: new Date().toISOString() }
    }));

    // Move to next step
    const currentIndex = STEP_ORDER.indexOf(stepId);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      setCurrentStep(nextStep);
      scrollToStep(nextStep);
    }
  }, [scrollToStep]);

  // Go to a specific step (for clicking on completed steps)
  const goToStep = useCallback((stepId) => {
    const stepIndex = STEP_ORDER.indexOf(stepId);
    const currentIndex = STEP_ORDER.indexOf(currentStep);

    // Can only go back to completed/skipped steps or forward if current is complete
    if (stepIndex <= currentIndex || completedSteps.includes(stepId) || skippedSteps.includes(stepId)) {
      setCurrentStep(stepId);
      scrollToStep(stepId);
    }
  }, [currentStep, completedSteps, skippedSteps, scrollToStep]);

  // Record micro-feedback for current step
  const recordFeedback = useCallback((stepId, feedbackType, value) => {
    setStepFeedback(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        [feedbackType]: value,
        feedbackAt: new Date().toISOString()
      }
    }));
  }, []);

  // Check if a step is visible (current or completed)
  const isStepVisible = useCallback((stepId) => {
    const stepIndex = STEP_ORDER.indexOf(stepId);
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    return stepIndex <= currentIndex;
  }, [currentStep]);

  // Check if a step is active (current step)
  const isStepActive = useCallback((stepId) => {
    return stepId === currentStep;
  }, [currentStep]);

  // Get all collected data for analytics
  const getFlowData = useCallback(() => {
    return {
      completedSteps,
      skippedSteps,
      stepFeedback,
      currentStep,
      completionRate: (completedSteps.length / STEP_ORDER.length) * 100
    };
  }, [completedSteps, skippedSteps, stepFeedback, currentStep]);

  // Reset flow for new analysis
  const resetFlow = useCallback(() => {
    setCurrentStep('pick-price'); // Start at pick-price since analyze is done
    setCompletedSteps(['analyze']);
    setSkippedSteps([]);
    setStepFeedback({});
  }, []);

  return {
    // State
    currentStep,
    completedSteps,
    skippedSteps,
    stepFeedback,

    // Actions
    completeStep,
    skipStep,
    goToStep,
    recordFeedback,
    resetFlow,

    // Ref management
    registerStepRef,
    scrollToStep,

    // Helpers
    isStepVisible,
    isStepActive,
    getFlowData,

    // Constants
    STEP_ORDER
  };
}
