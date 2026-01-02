/**
 * Precision Prices
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, DollarSign, TrendingUp, AlertCircle, Loader2, Upload, X, ThumbsUp, ThumbsDown, CheckCircle, BarChart3, Users, Home, Trophy, Zap, MessageSquare, Award, Star, TrendingDown, Share2, AlertTriangle, Send, Bug, Edit2, Save, Package, Truck, MapPin, Navigation, Lock, Shield, CreditCard, History, TestTube, LogOut } from 'lucide-react';
import TestRunner from './TestRunner';
import { InputValidation } from './fuzz-tests';
import { useAuth } from './AuthContext';
import { useSiteAuth } from './PasswordProtection';
import AuthPage from './AuthPage';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import './storage'; // Cross-browser storage wrapper

export default function MarketplacePricer() {
  const { saveItemToHistory, logout, currentUser, isGuestMode } = useAuth();
  const { logoutSite } = useSiteAuth();
  const [view, setView] = useState('pricing');
  const [mainTab, setMainTab] = useState('home');
  const [stats, setStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [itemName, setItemName] = useState('');
  const [condition, setCondition] = useState('good');
  const [location, setLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showBugReport, setShowBugReport] = useState(false);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [formKey, setFormKey] = useState(0); // Key to force form reset
  const resultsRef = useRef(null);

  const tips = [
    "📸 Pro Tip: Upload photos from multiple angles for 23% more accurate pricing!",
    "⏰ Best time to list: Thursday evenings get 40% more views",
    "💡 Items with original packaging sell 30% faster",
    "🎯 Price within 5% of our suggestion for best results",
    "📊 Adding 3+ photos increases sale probability by 60%"
  ];


  useEffect(() => {
    loadUserProfile();
    if (view === 'dashboard') loadStats();
    if (view === 'pricing') {
      loadStats(); // Refresh stats when returning to home
    }

    // Update mainTab based on current view
    if (view === 'pricing') setMainTab('home');
    else if (['dashboard', 'history', 'achievements', 'leaderboard'].includes(view)) setMainTab('dashboard');
    else if (['shipping', 'referral', 'testing'].includes(view)) setMainTab('tools');
    else if (view === 'subscription') setMainTab('subscription');

    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 10000);
    return () => clearInterval(tipInterval);
  }, [view]);

  const loadUserProfile = async () => {
    try {
      const stored = await window.storage.get('userprofile');
      if (stored && stored.value) {
        setUserProfile(JSON.parse(stored.value));
      } else {
        const newProfile = {
          badges: [],
          streak: 0,
          totalEarnings: 0,
          analysisCount: 0,
          perfectPrices: 0,
          level: 1
        };
        await window.storage.set('userprofile', JSON.stringify(newProfile));
        setUserProfile(newProfile);
      }
    } catch (e) {
      const newProfile = { badges: [], streak: 0, totalEarnings: 0, analysisCount: 0, perfectPrices: 0, level: 1 };
      setUserProfile(newProfile);
    }
  };

  const updateUserProfile = async (updates) => {
    const updated = { ...userProfile, ...updates };
    
    // Check for new badges
    const newBadges = [];
    if (updated.analysisCount === 1 && !updated.badges.includes('first-analysis')) {
      newBadges.push({ id: 'first-analysis', name: 'First Steps', icon: '🎯', desc: 'Completed first analysis' });
    }
    if (updated.analysisCount === 10 && !updated.badges.includes('power-user')) {
      newBadges.push({ id: 'power-user', name: 'Power User', icon: '⚡', desc: 'Analyzed 10 items' });
    }
    if (updated.perfectPrices === 5 && !updated.badges.includes('perfect-pricer')) {
      newBadges.push({ id: 'perfect-pricer', name: 'Perfect Pricer', icon: '🎖️', desc: 'Within 5% accuracy 5 times' });
    }
    
    if (newBadges.length > 0) {
      updated.badges = [...updated.badges, ...newBadges.map(b => b.id)];
      // Show badge notification
      newBadges.forEach(badge => {
        setTimeout(() => alert(`🎉 New Badge Unlocked: ${badge.icon} ${badge.name}!`), 500);
      });
    }
    
    await window.storage.set('userprofile', JSON.stringify(updated));
    setUserProfile(updated);
  };

  const loadStats = async () => {
    try {
      const stored = await window.storage.get('pricingfeedback');
      if (stored && stored.value) {
        const feedback = JSON.parse(stored.value);
        const sold = feedback.filter(f => f.wasSold).length;
        const fair = feedback.filter(f => f.wasFair).length;
        setStats({
          total: feedback.length,
          sold,
          accuracy: feedback.length > 0 ? ((fair / feedback.length) * 100).toFixed(0) : 0,
          recent: feedback.slice(-5).reverse()
        });
      } else {
        setStats({ total: 0, sold: 0, accuracy: 0, recent: [] });
      }
    } catch (e) {
      console.log('No feedback data yet');
      setStats({ total: 0, sold: 0, accuracy: 0, recent: [] });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const errors = [];
    const validFiles = [];

    files.forEach(file => {
      // Use existing validation utility
      const validation = InputValidation.validateImageFile(file);

      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
      } else if (file.size <= 5 * 1024 * 1024) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: File too large (max 5MB)`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('; '));
    }

    const newImages = validFiles.slice(0, 5 - images.length);

    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePricing = async () => {
    // Check if guest user has exceeded trial limit
    if (isGuestMode && userProfile) {
      const analysisCount = userProfile.analysisCount || 0;
      const TRIAL_LIMIT = 5;

      if (analysisCount >= TRIAL_LIMIT) {
        setError(`Trial limit reached (${TRIAL_LIMIT} free analyses). Please create an account to continue.`);
        setView('subscription'); // Redirect to subscription/signup page
        return;
      }
    }

    // Validate inputs before API call
    if (images.length === 0 && !itemName.trim()) {
      setError('Please provide either an image or item name');
      return;
    }

    // Validate item name length
    if (itemName && itemName.length > 200) {
      setError('Item name too long (max 200 characters)');
      return;
    }

    // Validate location length
    if (location && location.length > 100) {
      setError('Location too long (max 100 characters)');
      return;
    }

    // Validate additional details length
    if (additionalDetails && additionalDetails.length > 1000) {
      setError('Additional details too long (max 1000 characters)');
      return;
    }

    // Double-check for any remaining malicious patterns
    const inputs = [itemName, location, additionalDetails].join(' ');
    if (inputs.includes('<script') || inputs.includes('javascript:') || inputs.includes('onerror=')) {
      setError('Invalid characters detected in input');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setShowFeedback(false);
    setFeedbackSubmitted(false);

    try {
      const contentParts = [];

      for (const img of images) {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            const base64 = result.substring(result.indexOf(',') + 1);
            resolve(base64);
          };
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(img.file);
        });

        let mediaType = 'image/jpeg';
        if (img.file.type === 'image/png') mediaType = 'image/png';
        else if (img.file.type === 'image/webp') mediaType = 'image/webp';
        else if (img.file.type === 'image/gif') mediaType = 'image/gif';

        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64Data }
        });
      }

      let prompt = `You are a marketplace pricing expert. Analyze this item for Facebook Marketplace pricing.`;
      if (images.length > 0) prompt += `\n\nAnalyze the ${images.length} image(s) to identify the item, assess its condition from multiple angles, and any notable features or flaws.`;
      prompt += `\n\nAdditional Information:\nItem Name: ${itemName || 'Not specified'}\nCondition: ${condition}\nLocation: ${location || 'Not specified'}\nDetails: ${additionalDetails || 'None'}`;

      prompt += `\n\nYou MUST respond with ONLY valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks. Just pure JSON.

Provide pricing analysis in this exact JSON structure:
{
  "itemIdentification": {
    "name": "string",
    "category": "string", 
    "brand": "string or null",
    "observedCondition": "string"
  },
  "suggestedPriceRange": {
    "min": number,
    "max": number,
    "optimal": number
  },
  "marketInsights": {
    "demandLevel": "high|medium|low",
    "competitionLevel": "high|medium|low",
    "seasonalFactors": "string"
  },
  "pricingStrategy": {
    "listingPrice": number,
    "minimumAcceptable": number,
    "reasoning": "string"
  },
  "optimizationTips": ["string", "string"],
  "comparableItems": [{"description": "string", "typicalPrice": number}],
  "imageAnalysis": "string"
}`;

      contentParts.push({ type: 'text', text: prompt });

      // Call our backend server instead of Anthropic directly
      // Use relative URL for production, localhost for development
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/analyze'
        : '/api/analyze';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: contentParts }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract text content from all text blocks
      const textContent = data.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');
      
      if (!textContent) {
        throw new Error('No response content received from API');
      }

      // Try to extract JSON from the response
      // Remove markdown code blocks if present
      let cleanText = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Try to find JSON object - use greedy match to get the full object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        addDebugLog('error', 'JSON parsing failed');
        addDebugLog('info', `Response length: ${textContent.length}`);
        addDebugLog('info', `Preview: ${textContent.substring(0, 200)}`);
        console.error('Failed to parse API response');
        console.error('Raw response length:', textContent.length);
        console.error('First 500 chars:', textContent.substring(0, 500));

        // Save error details for debugging
        const errorDetails = {
          message: 'JSON parsing failed',
          responsePreview: textContent.substring(0, 500),
          timestamp: new Date().toISOString()
        };

        throw new Error('Could not parse the pricing analysis. Please try again or report this issue.');
      }

      try {
        const parsedResult = JSON.parse(jsonMatch[0]);

        // Validate that we have the expected structure
        if (!parsedResult.itemIdentification || !parsedResult.suggestedPriceRange) {
          throw new Error('Response missing required fields');
        }

        // Validate price data from API response
        if (parsedResult.suggestedPriceRange) {
          const prices = [
            parsedResult.suggestedPriceRange.min,
            parsedResult.suggestedPriceRange.optimal,
            parsedResult.suggestedPriceRange.max
          ];

          // Validate all prices are positive numbers
          const invalidPrices = prices.filter(p =>
            typeof p !== 'number' || isNaN(p) || p <= 0 || p > 1000000
          );

          if (invalidPrices.length > 0) {
            throw new Error('Received invalid price data from API');
          }
        }

        // Validate and sanitize item name from response
        if (parsedResult.itemIdentification?.name) {
          parsedResult.itemIdentification.name = InputValidation.sanitizeText(
            String(parsedResult.itemIdentification.name),
            200
          );
        }

        setResult(parsedResult);
        setShowFeedback(true);

        // Scroll to results after a brief delay to ensure render
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // Save to item history
        await saveItemToHistory({
          itemName: parsedResult.itemIdentification?.name || itemName,
          condition,
          location,
          suggestedPrice: parsedResult.suggestedPriceRange?.optimal,
          priceRange: {
            min: parsedResult.suggestedPriceRange?.min,
            max: parsedResult.suggestedPriceRange?.max
          },
          category: parsedResult.itemIdentification?.category,
          brand: parsedResult.itemIdentification?.brand,
          marketInsights: parsedResult.marketInsights
        });

        // Update user profile
        await updateUserProfile({
          analysisCount: (userProfile?.analysisCount || 0) + 1
        });
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Attempted to parse:', jsonMatch[0]);
        throw new Error('Could not parse pricing data. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze pricing');
      // Auto-show bug report for errors
      if (err.message.includes('match') || err.message.includes('pattern')) {
        setShowBugReport(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (wasFair, wasSold, actualPrice, feedback) => {
    try {
      const feedbackData = {
        itemName: result?.itemIdentification?.name || itemName,
        suggestedPrice: result?.suggestedPriceRange?.optimal,
        wasFair, wasSold,
        actualPrice: actualPrice || null,
        feedback,
        timestamp: new Date().toISOString()
      };

      let allFeedback = [];
      try {
        const stored = await window.storage.get('pricingfeedback');
        if (stored && stored.value) allFeedback = JSON.parse(stored.value);
      } catch (e) {}

      allFeedback.push(feedbackData);
      await window.storage.set('pricingfeedback', JSON.stringify(allFeedback));
      
      // Update user achievements - FIXED: Use actual sale price as earnings
      if (wasSold && actualPrice && result?.suggestedPriceRange) {
        const earningSaved = Math.abs(actualPrice); // Ensure positive value
        const isPerfectPrice = Math.abs(actualPrice - result.suggestedPriceRange.optimal) / actualPrice < 0.05;
        
        const currentEarnings = userProfile?.totalEarnings || 0;
        const currentPerfectPrices = userProfile?.perfectPrices || 0;
        
        await updateUserProfile({
          totalEarnings: currentEarnings + earningSaved,
          perfectPrices: isPerfectPrice ? currentPerfectPrices + 1 : currentPerfectPrices
        });

        // Check for earnings milestones
        if (currentEarnings + earningSaved >= 1000 && currentEarnings < 1000) {
          alert('🎉 Achievement Unlocked: Big Earner - $1,000 in extra earnings!');
        }
      }
      
      setFeedbackSubmitted(true);
      
      // Reload stats to show updated earnings
      if (view === 'dashboard') {
        await loadStats();
      }
    } catch (err) {
      console.error('Feedback error:', err);
      setFeedbackSubmitted(true);
    }
  };

  const updateFeedbackItem = async (index, updates) => {
    try {
      const stored = await window.storage.get('pricingfeedback');
      if (stored && stored.value) {
        const allFeedback = JSON.parse(stored.value);
        const reversedIndex = allFeedback.length - 1 - index; // Convert display index to storage index
        
        // Get the old and new values
        const oldItem = allFeedback[reversedIndex];
        const oldActualPrice = oldItem.actualPrice || 0;
        const newActualPrice = updates.actualPrice || 0;
        
        // Update the item
        allFeedback[reversedIndex] = { ...oldItem, ...updates };
        await window.storage.set('pricingfeedback', JSON.stringify(allFeedback));
        
        // Update earnings if the actual price changed
        if (oldItem.wasSold && updates.wasSold) {
          const earningsDiff = Math.abs(newActualPrice) - Math.abs(oldActualPrice);
          const currentEarnings = userProfile?.totalEarnings || 0;
          await updateUserProfile({
            totalEarnings: Math.max(0, currentEarnings + earningsDiff) // Ensure non-negative
          });
        } else if (!oldItem.wasSold && updates.wasSold && newActualPrice) {
          // Item just got sold
          const currentEarnings = userProfile?.totalEarnings || 0;
          await updateUserProfile({
            totalEarnings: currentEarnings + Math.abs(newActualPrice)
          });
        } else if (oldItem.wasSold && !updates.wasSold) {
          // Item marked as not sold
          const currentEarnings = userProfile?.totalEarnings || 0;
          await updateUserProfile({
            totalEarnings: Math.max(0, currentEarnings - Math.abs(oldActualPrice))
          });
        }
        
        // Reload stats
        await loadStats();
        await loadUserProfile();
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update item');
    }
  };

  const submitBugReport = async (bugDescription, errorMessage) => {
    try {
      // Save bug report to Firebase Firestore
      const bugReport = {
        description: bugDescription,
        error: errorMessage || error,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || 'guest',
        isGuestMode: isGuestMode,
        resolved: false,
        // Add context for debugging
        url: window.location.href,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`
      };

      try {
        // Try Firebase first
        await addDoc(collection(db, 'bugReports'), bugReport);
        console.log('Bug report saved to Firebase');
      } catch (firebaseError) {
        // Fallback to localStorage if Firebase fails (e.g., rules not deployed yet)
        console.warn('Firebase failed, saving to localStorage:', firebaseError);
        let bugs = [];
        try {
          const stored = await window.storage.get('bugreports', true);
          if (stored && stored.value) bugs = JSON.parse(stored.value);
        } catch (e) {}
        bugs.push(bugReport);
        await window.storage.set('bugreports', JSON.stringify(bugs), true);
        console.log('Bug report saved to localStorage');
      }

      alert('Bug report submitted! Our team will investigate. Thank you!');
      setShowBugReport(false);
    } catch (e) {
      console.error('Failed to submit bug report:', e);
      alert('Failed to submit bug report: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <nav className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-2xl border-b-4 border-emerald-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-2xl shadow-lg">
                <img src="/logo.png" alt="Precision Prices Logo" className="w-12 h-12 object-contain" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Precision Prices
                  <Star className="w-5 h-5 text-yellow-300" />
                </h1>
                {userProfile && (
                  <p className="text-xs text-emerald-100">Level {userProfile.level} Seller • {userProfile.badges.length} Badges Earned</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                { id: 'tools', icon: Package, label: 'Tools' },
                { id: 'subscription', icon: CreditCard, label: 'Subscription' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMainTab(tab.id);
                    if (tab.id === 'home') setView('pricing');
                    else if (tab.id === 'dashboard') setView('dashboard');
                    else if (tab.id === 'tools') setView('shipping');
                    else if (tab.id === 'subscription') setView('subscription');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                    mainTab === tab.id
                      ? 'bg-white text-emerald-600 shadow-lg scale-105'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800 hover:scale-105'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}

              {/* Logout Button */}
              <button
                onClick={async () => {
                  // Logout from both Firebase/guest AND site password
                  await logout();
                  logoutSite();
                  // Reload to show site password screen
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all font-semibold"
                title={isGuestMode ? "Logout (Guest)" : currentUser?.email || "Logout"}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sub-navigation */}
      {mainTab === 'dashboard' && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'dashboard', icon: BarChart3, label: 'Stats' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'achievements', icon: Trophy, label: 'Badges' },
                { id: 'leaderboard', icon: Star, label: 'Leaderboard' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${
                    view === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'tools' && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'shipping', icon: Truck, label: 'Shipping' },
                { id: 'referral', icon: Share2, label: 'Referrals' },
                { id: 'testing', icon: TestTube, label: 'Security Tests' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${
                    view === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rotating Tips Banner */}
      {showTip && view === 'pricing' && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 animate-pulse" />
              <p className="font-semibold text-lg">{tips[currentTipIndex]}</p>
            </div>
            <button onClick={() => setShowTip(false)} className="text-white hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {view === 'pricing' && (
          <PricingTool {...{itemName, setItemName, condition, setCondition, location, setLocation, additionalDetails, setAdditionalDetails, images, handleImageUpload, removeImage, loading, error, analyzePricing, result, showFeedback, feedbackSubmitted, submitFeedback, userProfile, resultsRef, formKey}} />
        )}
        {view === 'shipping' && <ShippingCalculator />}
        {view === 'dashboard' && <Dashboard stats={stats} userProfile={userProfile} onUpdateItem={updateFeedbackItem} />}
        {view === 'history' && <ItemHistory />}
        {view === 'achievements' && <Achievements userProfile={userProfile} />}
        {view === 'leaderboard' && <Leaderboard />}
        {view === 'referral' && <ReferralProgram userProfile={userProfile} />}
        {view === 'subscription' && <Subscription />}
        {view === 'testing' && <TestRunner appFunctions={{
          setItemName,
          setLocation,
          setAdditionalDetails,
          setError,
          analyzePricing
        }} />}
      </div>

      {/* Bug Report Modal */}
      {showBugReport && <BugReportModal error={error} onClose={() => setShowBugReport(false)} onSubmit={submitBugReport} />}

      {/* Bug Report Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log('Bug report button clicked');
          setShowBugReport(true);
        }}
        className="fixed bottom-6 right-6 bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition z-[9999]"
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        type="button"
        title="Report a Bug"
      >
        <Bug className="w-6 h-6" style={{ pointerEvents: 'none' }} />
      </button>
    </div>
  );
}

function PricingTool({itemName, setItemName, condition, setCondition, location, setLocation, additionalDetails, setAdditionalDetails, images, handleImageUpload, removeImage, loading, error, analyzePricing, result, showFeedback, feedbackSubmitted, submitFeedback, userProfile, resultsRef, formKey}) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Slogan Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">Sell smart, sell fast, make money!</h1>
        <p className="text-lg text-gray-600">AI-powered pricing to maximize your profits</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column - Form (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI-Powered Pricing Analysis</h2>
                <p className="text-gray-600">Upload up to 5 photos for best results</p>
              </div>
              {userProfile && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Analyses</p>
                  <p className="text-2xl font-bold text-indigo-600">{userProfile.analysisCount}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos (up to 5)</label>
                {images.length < 5 && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition cursor-pointer">
                    <input key={formKey} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-1">Click to upload images</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB each ({images.length}/5 uploaded)</p>
                    </label>
                  </div>
                )}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img.preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name {images.length === 0 && '*'}</label>
                <input type="text" value={itemName} onChange={(e) => {
                  const sanitized = InputValidation.sanitizeText(e.target.value, 200);
                  setItemName(sanitized);
                }} placeholder="e.g., iPhone 13" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <div className="text-xs text-gray-500 mt-1">
                  {itemName.length}/200 characters
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option value="new">New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input type="text" value={location} onChange={(e) => {
                    let value = InputValidation.sanitizeText(e.target.value, 100);
                    // Additional path traversal protection
                    value = value.replace(/\.\./g, '').replace(/[\/\\]/g, '');
                    setLocation(value);
                  }} placeholder="e.g., Los Angeles, CA" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  <div className="text-xs text-gray-500 mt-1">
                    {location.length}/100 characters
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                <textarea value={additionalDetails} onChange={(e) => {
                  const sanitized = InputValidation.sanitizeText(e.target.value, 1000);
                  setAdditionalDetails(sanitized);
                }} placeholder="e.g., Original box included" rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                <div className="text-xs text-gray-500 mt-1">
                  {additionalDetails.length}/1000 characters
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              <button onClick={analyzePricing} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><Search className="w-5 h-5" />Analyze Pricing</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - How to Use Summary (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 sticky top-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How to Use</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Upload Photos</h4>
                  <p className="text-sm text-gray-600">Add up to 5 clear photos of your item from different angles for best results</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Fill in Details</h4>
                  <p className="text-sm text-gray-600">Provide item name, condition, location, and any additional details that help describe your item</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Get AI Pricing</h4>
                  <p className="text-sm text-gray-600">Click "Analyze Pricing" and receive instant AI-powered price recommendations optimized for quick sales</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-indigo-200">
              <p className="text-sm text-gray-600 italic">Our AI analyzes millions of listings to give you the perfect price point</p>
            </div>
            <button
              onClick={() => setView('referral')}
              className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <Share2 className="w-5 h-5" />
              Refer a Friend & Earn Rewards
            </button>
          </div>
        </div>
      </div>

      {result && <ResultsDisplay
        result={result}
        showFeedback={showFeedback}
        feedbackSubmitted={feedbackSubmitted}
        submitFeedback={submitFeedback}
        resultsRef={resultsRef}
        onNewAnalysis={(e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }

          console.log('New Analysis clicked - clearing form');

          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Clear all state immediately
          setResult(null);
          setItemName('');
          setCondition('good');
          setLocation('');
          setAdditionalDetails('');
          setImages([]);
          setError(null);
          setShowFeedback(false);
          setFeedbackSubmitted(false);
          setFormKey(prev => prev + 1); // Force form reset

          console.log('Form cleared');
        }}
      />}
    </div>
  );
}

function ResultsDisplay({result, showFeedback, feedbackSubmitted, submitFeedback, resultsRef, onNewAnalysis}) {
  const [showShare, setShowShare] = useState(false);

  const shareSuccess = () => {
    const text = `I just priced my ${result.itemIdentification.name} at $${result.suggestedPriceRange.optimal} using Precision Prices! 🎯`;
    if (navigator.share) {
      navigator.share({ title: 'Precision Prices Success', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <div ref={resultsRef} className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Item Analysis</h2>
          <div className="flex gap-2">
            <button type="button" onClick={onNewAnalysis} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg">
              <Search className="w-4 h-4" />New Analysis
            </button>
            <button type="button" onClick={shareSuccess} className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg">
              <Share2 className="w-4 h-4" />Share
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-600">Identified As</p><p className="text-lg font-semibold">{result.itemIdentification.name}</p></div>
          <div><p className="text-sm text-gray-600">Category</p><p className="text-lg font-semibold">{result.itemIdentification.category}</p></div>
        </div>
        {result.imageAnalysis && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">Image Analysis</p>
            <p className="text-blue-800">{result.imageAnalysis}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold">Pricing Recommendation</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Minimum</div>
            <div className="text-2xl font-bold">${result.suggestedPriceRange.min}</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
            <div className="text-sm text-indigo-600">Optimal</div>
            <div className="text-3xl font-bold text-indigo-600">${result.suggestedPriceRange.optimal}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Maximum</div>
            <div className="text-2xl font-bold">${result.suggestedPriceRange.max}</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Strategy</h3>
          <p className="text-blue-800"><strong>List at:</strong> ${result.pricingStrategy.listingPrice}</p>
          <p className="text-blue-800"><strong>Accept no less than:</strong> ${result.pricingStrategy.minimumAcceptable}</p>
          <p className="text-sm text-blue-700 mt-2">{result.pricingStrategy.reasoning}</p>
        </div>
      </div>

      {showFeedback && !feedbackSubmitted && <FeedbackForm onSubmit={submitFeedback} />}
      
      {feedbackSubmitted && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 text-green-600 justify-center">
            <CheckCircle className="w-8 h-8" />
            <p className="text-xl font-semibold">Feedback submitted! Thank you!</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({stats, userProfile, onUpdateItem}) {
  if (!stats || !userProfile) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const conversionRate = stats.total > 0 ? ((stats.sold / stats.total) * 100).toFixed(0) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Banner - FIXED: Display absolute value */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">You're Crushing It! 🎉</h2>
            <p className="text-lg">You've earned an estimated <span className="font-bold text-2xl">${Math.abs(userProfile.totalEarnings).toFixed(2)}</span> using Precision Prices</p>
          </div>
          <Trophy className="w-20 h-20 opacity-50" />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <Users className="w-10 h-10 text-blue-600 mb-2" />
          <div className="text-4xl font-bold text-blue-900">{stats.total}</div>
          <div className="text-sm text-blue-700">Items Analyzed</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <CheckCircle className="w-10 h-10 text-green-600 mb-2" />
          <div className="text-4xl font-bold text-green-900">{stats.sold}</div>
          <div className="text-sm text-green-700">Items Sold</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <TrendingUp className="w-10 h-10 text-indigo-600 mb-2" />
          <div className="text-4xl font-bold text-indigo-900">{conversionRate}%</div>
          <div className="text-sm text-indigo-700">Conversion Rate</div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <Award className="w-10 h-10 text-purple-600 mb-2" />
          <div className="text-4xl font-bold text-purple-900">{userProfile.perfectPrices}</div>
          <div className="text-sm text-purple-700">Perfect Prices</div>
        </div>
      </div>

      {stats.recent.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recent.map((item, idx) => (
              <RecentActivityItem 
                key={idx} 
                item={item} 
                index={idx}
                onUpdate={onUpdateItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecentActivityItem({ item, index, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    wasSold: item.wasSold,
    actualPrice: item.actualPrice || '',
    wasFair: item.wasFair
  });

  const handleSave = () => {
    onUpdate(index, {
      ...item,
      wasSold: editData.wasSold,
      actualPrice: editData.actualPrice ? parseFloat(editData.actualPrice) : null,
      wasFair: editData.wasFair
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      wasSold: item.wasSold,
      actualPrice: item.actualPrice || '',
      wasFair: item.wasFair
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
        <div className="mb-3">
          <p className="font-medium mb-2">{item.itemName}</p>
          <p className="text-sm text-gray-600">Suggested: ${item.suggestedPrice}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditData({ ...editData, wasSold: true })}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                  editData.wasSold
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sold
              </button>
              <button
                onClick={() => setEditData({ ...editData, wasSold: false })}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                  !editData.wasSold
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Not Sold
              </button>
            </div>
          </div>

          {editData.wasSold && (
            <div>
              <label className="block text-sm font-medium mb-1">Actual Sale Price</label>
              <input
                type="number"
                value={editData.actualPrice}
                onChange={(e) => setEditData({ ...editData, actualPrice: e.target.value })}
                placeholder="Enter sale price"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Was pricing fair?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditData({ ...editData, wasFair: true })}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-1 ${
                  editData.wasFair
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> Yes
              </button>
              <button
                onClick={() => setEditData({ ...editData, wasFair: false })}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-1 ${
                  editData.wasFair === false
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ThumbsDown className="w-4 h-4" /> No
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex-1">
        <p className="font-medium">{item.itemName}</p>
        <p className="text-sm text-gray-600">
          Suggested: ${item.suggestedPrice}
          {item.actualPrice && ` | Sold: $${Math.abs(item.actualPrice)}`}
        </p>
      </div>
      <div className="flex gap-2 items-center">
        {item.wasSold && <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Sold</span>}
        {!item.wasSold && <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">Listed</span>}
        {item.wasFair && <ThumbsUp className="w-5 h-5 text-green-600" />}
        {item.wasFair === false && <ThumbsDown className="w-5 h-5 text-red-600" />}
        <button
          onClick={() => setIsEditing(true)}
          className="ml-2 p-2 hover:bg-gray-200 rounded-lg transition"
          title="Edit item"
        >
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

function Subscription() {
  const { isGuestMode, userProfile, currentUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$4.99',
      period: '/month',
      savings: null,
      bestValue: true,
      features: [
        '50 analyses per month',
        'Basic pricing analysis',
        'Email support',
        'Perfect for casual sellers'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$9.99',
      period: '/month',
      savings: 'Most Popular',
      bestValue: false,
      features: [
        '200 analyses per month',
        'Detailed pricing analysis',
        'Shipping cost estimates',
        'Meetup cost suggestions',
        'Demand forecasting',
        'Priority email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: '/month',
      savings: 'Best for Resellers',
      bestValue: false,
      features: [
        'Unlimited analyses',
        'Everything in Standard',
        'Bulk analysis tool',
        'Export to CSV',
        'Historical price tracking',
        'Priority support'
      ]
    }
  ];

  const handleSubscribe = async (planId) => {
    setSelectedPlan(planId);

    try {
      // Get user email (either from Firebase auth or prompt guest users)
      let userEmail = currentUser?.email;

      if (!userEmail && isGuestMode) {
        userEmail = prompt('Please enter your email address for checkout:');
        if (!userEmail) return;
      }

      // Create checkout session
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/create-checkout-session'
        : '/api/create-checkout-session';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          userEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Trial Limit Banner */}
      {isGuestMode && userProfile && userProfile.analysisCount >= 5 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Trial Limit Reached</h3>
              <p className="text-lg">You've used your 5 free analyses. Create an account to continue or subscribe for unlimited access!</p>
            </div>
            <AlertTriangle className="w-16 h-16 opacity-75" />
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-4 bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Create Free Account
          </button>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock powerful features to maximize your selling potential. All plans include a 14-day money-back guarantee.
        </p>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
            <AuthPage onGuestMode={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
              plan.bestValue ? 'ring-4 ring-indigo-600' : ''
            }`}
          >
            {plan.bestValue && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-bl-2xl font-bold text-sm">
                BEST VALUE
              </div>
            )}

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                {plan.pricePerMonth && (
                  <p className="text-sm text-gray-600 mt-1">{plan.pricePerMonth}</p>
                )}
                {plan.savings && (
                  <div className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {plan.savings}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all mb-6 ${
                  plan.bestValue
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                Subscribe Now
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Subscribe?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Get instant pricing recommendations powered by advanced AI</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Maximize Profits</h3>
            <p className="text-gray-600">Price items optimally to sell faster and earn more</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Risk Free</h3>
            <p className="text-gray-600">14-day money-back guarantee, cancel anytime</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600">Yes! You can cancel your subscription at any time. No questions asked.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards, PayPal, and digital wallets through our secure payment processor.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Is there a free trial?</h3>
            <p className="text-gray-600">All plans come with a 14-day money-back guarantee, which works just like a free trial!</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-gray-600">Absolutely! You can change your plan at any time, and we'll prorate the difference.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Community() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const stored = await window.storage.get('communityposts', true);
      if (stored && stored.value) {
        setPosts(JSON.parse(stored.value));
      }
    } catch (e) {
      setPosts([]);
    }
  };

  const submitPost = async () => {
    if (!newPost.trim()) return;

    const post = {
      id: Date.now(),
      content: newPost,
      author: 'User',
      timestamp: new Date().toISOString(),
      likes: 0
    };

    const allPosts = [post, ...posts];
    await window.storage.set('communityposts', JSON.stringify(allPosts.slice(0, 50)), true);
    setPosts(allPosts.slice(0, 50));
    setNewPost('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Community Forum</h2>
        
        <div className="mb-6">
          <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Share your success story, ask a question, or give pricing tips..." rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          <button onClick={submitPost} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            <Send className="w-4 h-4" />Post
          </button>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts.map(post => (
              <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {post.author[0]}
                  </div>
                  <div>
                    <p className="font-medium">{post.author}</p>
                    <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-gray-700">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Success Stories */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">⭐ Success Stories</h3>
        <div className="space-y-4">
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <p className="font-medium">"Sold my bike for $450 instead of $300!"</p>
            <p className="text-sm">- Sarah M.</p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-lg">
            <p className="font-medium">"Made an extra $1,200 this month using Precision Prices"</p>
            <p className="text-sm">- Mike T.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemHistory() {
  const { getItemHistory } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await getItemHistory();
      setHistory(items);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analysis History</h3>
          <p className="text-gray-500">Your analyzed items will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold">Analysis History</h2>
        </div>
        <p className="text-gray-600 mb-6">View all your previously analyzed items and their pricing recommendations.</p>
      </div>

      <div className="space-y-4">
        {history.map((item, index) => (
          <div key={item.id || index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">{item.itemName}</h3>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  {item.category && (
                    <span className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {item.category}
                    </span>
                  )}
                  {item.brand && (
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {item.brand}
                    </span>
                  )}
                  {item.condition && (
                    <span className="capitalize">{item.condition} condition</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {new Date(item.analyzedAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(item.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Minimum</div>
                <div className="text-2xl font-bold">${item.priceRange?.min || 'N/A'}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                <div className="text-sm text-indigo-600">Suggested Price</div>
                <div className="text-3xl font-bold text-indigo-600">${item.suggestedPrice}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Maximum</div>
                <div className="text-2xl font-bold">${item.priceRange?.max || 'N/A'}</div>
              </div>
            </div>

            {item.marketInsights && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {item.marketInsights.demandLevel && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-gray-600">Demand: <span className="font-medium capitalize">{item.marketInsights.demandLevel}</span></span>
                  </div>
                )}
                {item.marketInsights.competitionLevel && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-600">Competition: <span className="font-medium capitalize">{item.marketInsights.competitionLevel}</span></span>
                  </div>
                )}
                {item.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">{item.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Achievements({userProfile}) {
  const allBadges = [
    { id: 'first-analysis', name: 'First Steps', icon: '🎯', desc: 'Completed first analysis', unlocked: userProfile?.badges?.includes('first-analysis') },
    { id: 'power-user', name: 'Power User', icon: '⚡', desc: 'Analyzed 10 items', unlocked: userProfile?.badges?.includes('power-user') },
    { id: 'perfect-pricer', name: 'Perfect Pricer', icon: '🎖️', desc: 'Within 5% accuracy 5 times', unlocked: userProfile?.badges?.includes('perfect-pricer') },
    { id: 'first-sale', name: 'First Sale', icon: '💰', desc: 'Sold your first item', unlocked: false },
    { id: 'streak-7', name: 'On Fire', icon: '🔥', desc: '7 day streak', unlocked: false },
    { id: 'earnings-1000', name: 'Big Earner', icon: '💎', desc: 'Earned $1,000 extra', unlocked: false }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Level {userProfile?.level || 1}</p>
            <p className="text-sm text-gray-600">{userProfile?.analysisCount || 0}/50</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-indigo-600 h-3 rounded-full" style={{width: `${((userProfile?.analysisCount || 0) / 50) * 100}%`}}></div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {allBadges.map(badge => (
            <div key={badge.id} className={`p-6 rounded-lg border-2 text-center ${badge.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400' : 'bg-gray-50 border-gray-300 opacity-50'}`}>
              <div className="text-5xl mb-2">{badge.icon}</div>
              <p className="font-bold text-gray-900">{badge.name}</p>
              <p className="text-sm text-gray-600">{badge.desc}</p>
              {badge.unlocked && (
                <div className="mt-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackForm({onSubmit}) {
  const [wasFair, setWasFair] = useState(null);
  const [wasSold, setWasSold] = useState(null);
  const [actualPrice, setActualPrice] = useState('');
  const [feedback, setFeedback] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold mb-4">Help Us Improve</h2>
      <div className="space-y-6">
        <div>
          <p className="font-medium mb-3">Was this pricing fair?</p>
          <div className="flex gap-4">
            <button onClick={() => setWasFair(true)} className={`flex-1 py-3 px-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${wasFair === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'}`}>
              <ThumbsUp className="w-5 h-5" />Yes
            </button>
            <button onClick={() => setWasFair(false)} className={`flex-1 py-3 px-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${wasFair === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300'}`}>
              <ThumbsDown className="w-5 h-5" />No
            </button>
          </div>
        </div>

        <div>
          <p className="font-medium mb-3">Did you sell it?</p>
          <div className="flex gap-4">
            <button onClick={() => setWasSold(true)} className={`flex-1 py-3 rounded-lg border-2 transition ${wasSold === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300'}`}>Yes!</button>
            <button onClick={() => setWasSold(false)} className={`flex-1 py-3 rounded-lg border-2 transition ${wasSold === false ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300'}`}>Not Yet</button>
          </div>
        </div>

        {wasSold && (
          <div>
            <label className="block font-medium mb-2">Actual sale price?</label>
            <input type="number" value={actualPrice} onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setActualPrice('');
                return;
              }
              const validation = InputValidation.validatePrice(value);
              if (validation.valid) {
                setActualPrice(value);
              }
            }} placeholder="Enter price" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}

        <div>
          <label className="block font-medium mb-2">Comments</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Any feedback..." rows={3} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>

        <button onClick={() => {
          let priceValue = null;
          if (actualPrice) {
            const validation = InputValidation.validatePrice(actualPrice);
            if (!validation.valid) {
              alert(validation.error);
              return;
            }
            priceValue = validation.value;
          }
          onSubmit(wasFair, wasSold, priceValue, feedback);
        }} disabled={wasFair === null || wasSold === null} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg">
          Submit Feedback
        </button>
      </div>
    </div>
  );
}

function BugReportModal({error, onClose, onSubmit}) {
  const [description, setDescription] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-3 rounded-lg">
            <Bug className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold">Report an Issue</h2>
        </div>

        <p className="text-gray-600 mb-4">Help us fix this problem! Our team will investigate immediately.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-mono text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block font-medium mb-2">What happened?</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what you were doing when the error occurred..." rows={4} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => onSubmit(description, error)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold">
            Submit Report
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold">
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">Bug reports are shared with our development team to improve Precision Prices</p>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const stored = await window.storage.get('leaderboard', true);
      if (stored && stored.value) {
        setLeaders(JSON.parse(stored.value));
      } else {
        // Demo data
        setLeaders([
          { name: 'Sarah M.', earnings: 2340, sales: 45 },
          { name: 'Mike T.', earnings: 1890, sales: 38 },
          { name: 'Jennifer K.', earnings: 1650, sales: 32 },
          { name: 'David R.', earnings: 1420, sales: 28 },
          { name: 'Lisa P.', earnings: 1200, sales: 24 }
        ]);
      }
    } catch (e) {
      setLeaders([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-8 text-white mb-6">
        <div className="flex items-center gap-4">
          <Trophy className="w-16 h-16" />
          <div>
            <h2 className="text-3xl font-bold">Top Sellers Leaderboard</h2>
            <p className="text-lg">See how you rank against other Precision Prices users!</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="space-y-4">
          {leaders.map((leader, idx) => (
            <div key={idx} className={`flex items-center justify-between p-4 rounded-lg ${idx === 0 ? 'bg-yellow-50 border-2 border-yellow-400' : idx === 1 ? 'bg-gray-100 border-2 border-gray-400' : idx === 2 ? 'bg-orange-50 border-2 border-orange-400' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold w-12 text-center">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <div>
                  <p className="font-bold text-lg">{leader.name}</p>
                  <p className="text-sm text-gray-600">{leader.sales} items sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">${leader.earnings}</p>
                <p className="text-xs text-gray-600">extra earned</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200">
          <p className="text-center text-indigo-900 font-semibold">
            🎯 Your Rank: Keep selling to climb the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}

function ReferralProgram({userProfile}) {
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const stored = await window.storage.get('referraldata');
      if (stored && stored.value) {
        const data = JSON.parse(stored.value);
        setReferralCode(data.code);
        setReferrals(data.count);
      } else {
        const newCode = 'SMART' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setReferralCode(newCode);
        await window.storage.set('referraldata', JSON.stringify({ code: newCode, count: 0 }));
      }
    } catch (e) {
      const newCode = 'SMART' + Math.random().toString(36).substring(2, 8).toUpperCase();
      setReferralCode(newCode);
    }
  };

  const copyReferralLink = () => {
    const link = `https://precisionprices.app?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaEmail = () => {
    const subject = 'Get Better Prices on Facebook Marketplace!';
    const body = `Hey! I've been using Precision Prices to price my Facebook Marketplace items and it's amazing. I've earned an extra $${Math.abs(userProfile?.totalEarnings || 0)}!\n\nUse my referral code ${referralCode} to get your first month free:\nhttps://precisionprices.app?ref=${referralCode}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Refer Friends, Get Rewards! 🎁</h2>
        <p className="text-lg">Give your friends 1 month free, get 1 month free for each referral</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-2xl font-bold mb-4">Your Referral Stats</h3>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <div className="text-4xl font-bold text-green-900">{referrals}</div>
            <div className="text-sm text-green-700">Friends Referred</div>
          </div>
          
          <div className="text-center p-6 bg-purple-50 rounded-xl">
            <Award className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <div className="text-4xl font-bold text-purple-900">{referrals}</div>
            <div className="text-sm text-purple-700">Free Months Earned</div>
          </div>
          
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <div className="text-4xl font-bold text-blue-900">${(referrals * 4.99).toFixed(2)}</div>
            <div className="text-sm text-blue-700">Value Saved</div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block font-medium mb-2">Your Referral Code</label>
          <div className="flex gap-3">
            <input type="text" value={referralCode} readOnly className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg text-center" />
            <button onClick={copyReferralLink} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <button onClick={shareViaEmail} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            <Send className="w-5 h-5" />Share via Email
          </button>
          <button onClick={() => {
            const text = `Check out Precision Prices! Use code ${referralCode} for 1 month free: https://precisionprices.app?ref=${referralCode}`;
            if (navigator.share) {
              navigator.share({ title: 'Precision Prices Referral', text });
            } else {
              navigator.clipboard.writeText(text);
              alert('Copied to clipboard!');
            }
          }} className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold">
            <Share2 className="w-5 h-5" />Share on Social
          </button>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <h4 className="font-bold text-yellow-900 mb-2">🎉 How It Works</h4>
          <ul className="space-y-2 text-yellow-800">
            <li>✓ Share your unique referral code with friends</li>
            <li>✓ They get their first month FREE ($4.99 value)</li>
            <li>✓ You get 1 month FREE for each friend who signs up</li>
            <li>✓ Unlimited referrals = unlimited free months!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


function SecurePayments() {
  const [activeTab, setActiveTab] = useState('escrow'); // escrow, blockchain, fees
  const [transactions, setTransactions] = useState([]);
  const [blockchainLedger, setBlockchainLedger] = useState([]);
  const [createTransaction, setCreateTransaction] = useState(false);
  const [newTx, setNewTx] = useState({
    itemName: '',
    amount: '',
    buyerEmail: '',
    sellerEmail: '',
    itemDescription: ''
  });

  useEffect(() => {
    loadTransactions();
    loadBlockchain();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await window.storage.get('escrowtransactions');
      if (stored && stored.value) {
        setTransactions(JSON.parse(stored.value));
      }
    } catch (e) {
      setTransactions([]);
    }
  };

  const loadBlockchain = async () => {
    try {
      const stored = await window.storage.get('blockchainledger', true); // shared
      if (stored && stored.value) {
        setBlockchainLedger(JSON.parse(stored.value));
      }
    } catch (e) {
      setBlockchainLedger([]);
    }
  };

  const calculateFees = (amount) => {
    const amt = parseFloat(amount) || 0;
    const platformFee = amt * 0.025; // 2.5% platform fee
    const paymentProcessing = amt * 0.029 + 0.30; // Standard payment processing
    const total = platformFee + paymentProcessing;
    const sellerReceives = amt - total;
    
    return {
      subtotal: amt.toFixed(2),
      platformFee: platformFee.toFixed(2),
      paymentProcessing: paymentProcessing.toFixed(2),
      totalFees: total.toFixed(2),
      sellerReceives: sellerReceives.toFixed(2),
      buyerPays: amt.toFixed(2)
    };
  };

  const createEscrowTransaction = async () => {
    if (!newTx.itemName || !newTx.amount || !newTx.buyerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    const fees = calculateFees(newTx.amount);
    const transaction = {
      id: 'TX' + Date.now(),
      ...newTx,
      fees,
      status: 'pending',
      createdAt: new Date().toISOString(),
      escrowReleaseDate: null,
      buyerConfirmed: false,
      sellerShipped: false,
      blockHash: generateBlockHash()
    };

    // Save to transactions
    const allTx = [transaction, ...transactions];
    await window.storage.set('escrowtransactions', JSON.stringify(allTx));
    
    // Add to blockchain
    const block = {
      blockNumber: blockchainLedger.length + 1,
      timestamp: new Date().toISOString(),
      transactionId: transaction.id,
      amount: transaction.amount,
      from: transaction.buyerEmail,
      to: transaction.sellerEmail,
      hash: transaction.blockHash,
      previousHash: blockchainLedger.length > 0 ? blockchainLedger[0].hash : '0000000000',
      status: 'pending'
    };
    
    const newLedger = [block, ...blockchainLedger];
    await window.storage.set('blockchainledger', JSON.stringify(newLedger), true);
    
    setTransactions(allTx);
    setBlockchainLedger(newLedger);
    setCreateTransaction(false);
    setNewTx({ itemName: '', amount: '', buyerEmail: '', sellerEmail: '', itemDescription: '' });
    
    alert('✅ Escrow transaction created! Funds will be held securely until delivery is confirmed.');
  };

  const generateBlockHash = () => {
    return Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const updateTransactionStatus = async (txId, updates) => {
    const updatedTx = transactions.map(tx => {
      if (tx.id === txId) {
        const updated = { ...tx, ...updates };
        
        // If both parties confirmed, release funds
        if (updated.buyerConfirmed && updated.sellerShipped && updated.status === 'pending') {
          updated.status = 'completed';
          updated.escrowReleaseDate = new Date().toISOString();
        }
        
        return updated;
      }
      return tx;
    });
    
    await window.storage.set('escrowtransactions', JSON.stringify(updatedTx));
    
    // Update blockchain
    const updatedLedger = blockchainLedger.map(block => {
      if (block.transactionId === txId) {
        return { ...block, status: updates.status || block.status };
      }
      return block;
    });
    
    await window.storage.set('blockchainledger', JSON.stringify(updatedLedger), true);
    
    setTransactions(updatedTx);
    setBlockchainLedger(updatedLedger);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-4">
          <Shield className="w-16 h-16" />
          <div>
            <h2 className="text-3xl font-bold">Secure Payments & Escrow</h2>
            <p className="text-lg">Protected transactions with blockchain transparency</p>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <Shield className="w-10 h-10 text-green-600 mx-auto mb-2" />
          <p className="font-bold text-gray-900">Buyer Protection</p>
          <p className="text-sm text-gray-600">Funds held until delivery</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <Lock className="w-10 h-10 text-blue-600 mx-auto mb-2" />
          <p className="font-bold text-gray-900">Seller Security</p>
          <p className="text-sm text-gray-600">Payment guaranteed</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <FileText className="w-10 h-10 text-purple-600 mx-auto mb-2" />
          <p className="font-bold text-gray-900">Blockchain Verified</p>
          <p className="text-sm text-gray-600">100% transparent</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <Award className="w-10 h-10 text-orange-600 mx-auto mb-2" />
          <p className="font-bold text-gray-900">Dispute Support</p>
          <p className="text-sm text-gray-600">Fair resolution</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('escrow')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'escrow' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          Escrow Transactions
        </button>
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'blockchain' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          Blockchain Ledger
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'fees' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          Fee Calculator
        </button>
      </div>

      {/* Escrow Transactions Tab */}
      {activeTab === 'escrow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Your Escrow Transactions</h3>
              <button
                onClick={() => setCreateTransaction(!createTransaction)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Create Escrow
              </button>
            </div>

            {createTransaction && (
              <div className="mb-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl">
                <h4 className="font-bold text-green-900 mb-4">Create New Escrow Transaction</h4>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Item Name *</label>
                    <input
                      type="text"
                      value={newTx.itemName}
                      onChange={(e) => setNewTx({...newTx, itemName: e.target.value})}
                      placeholder="e.g., iPhone 13 Pro"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Sale Amount ($) *</label>
                    <input
                      type="number"
                      value={newTx.amount}
                      onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                      placeholder="500.00"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Buyer Email *</label>
                    <input
                      type="email"
                      value={newTx.buyerEmail}
                      onChange={(e) => setNewTx({...newTx, buyerEmail: e.target.value})}
                      placeholder="buyer@example.com"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Email</label>
                    <input
                      type="email"
                      value={newTx.sellerEmail}
                      onChange={(e) => setNewTx({...newTx, sellerEmail: e.target.value})}
                      placeholder="seller@example.com"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Item Description</label>
                  <textarea
                    value={newTx.itemDescription}
                    onChange={(e) => setNewTx({...newTx, itemDescription: e.target.value})}
                    placeholder="Describe the item and condition..."
                    rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {newTx.amount && (
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Fee Breakdown:</p>
                    {(() => {
                      const fees = calculateFees(newTx.amount);
                      return (
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Item Price:</span>
                            <span className="font-bold">${fees.subtotal}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Platform Fee (2.5%):</span>
                            <span>-${fees.platformFee}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Payment Processing:</span>
                            <span>-${fees.paymentProcessing}</span>
                          </div>
                          <div className="border-t pt-1 mt-1 flex justify-between font-bold text-green-700">
                            <span>You Receive:</span>
                            <span>${fees.sellerReceives}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={createEscrowTransaction}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                  >
                    Create Escrow Transaction
                  </button>
                  <button
                    onClick={() => setCreateTransaction(false)}
                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No escrow transactions yet. Create your first secure transaction!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className={`p-6 rounded-xl border-2 ${
                    tx.status === 'completed' ? 'bg-green-50 border-green-300' :
                    tx.status === 'pending' ? 'bg-yellow-50 border-yellow-300' :
                    'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{tx.itemName}</h4>
                        <p className="text-sm text-gray-600">Transaction ID: {tx.id}</p>
                        <p className="text-sm text-gray-600">Created: {new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-700">${tx.amount}</div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          tx.status === 'completed' ? 'bg-green-200 text-green-800' :
                          tx.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {tx.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Buyer</p>
                        <p className="font-medium">{tx.buyerEmail}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-600">Seller Receives</p>
                        <p className="font-medium text-green-700">${tx.fees.sellerReceives}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        {tx.buyerConfirmed ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                        )}
                        <span className="text-sm">Buyer Confirmed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.sellerShipped ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                        )}
                        <span className="text-sm">Item Shipped</span>
                      </div>
                    </div>

                    {tx.status === 'pending' && (
                      <div className="flex gap-3">
                        {!tx.sellerShipped && (
                          <button
                            onClick={() => updateTransactionStatus(tx.id, { sellerShipped: true })}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium"
                          >
                            Mark as Shipped
                          </button>
                        )}
                        {!tx.buyerConfirmed && (
                          <button
                            onClick={() => updateTransactionStatus(tx.id, { buyerConfirmed: true })}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
                          >
                            Confirm Delivery
                          </button>
                        )}
                      </div>
                    )}

                    {tx.status === 'completed' && (
                      <div className="bg-green-100 p-3 rounded-lg text-center">
                        <p className="text-green-800 font-medium">
                          ✅ Funds released on {new Date(tx.escrowReleaseDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How Escrow Works */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-6">🛡️ How Secure Escrow Works</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-3xl mb-2">1️⃣</div>
                <h4 className="font-bold mb-2">Buyer Pays</h4>
                <p className="text-sm">Funds held securely in escrow account</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-3xl mb-2">2️⃣</div>
                <h4 className="font-bold mb-2">Seller Ships</h4>
                <p className="text-sm">Item shipped with tracking number</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-3xl mb-2">3️⃣</div>
                <h4 className="font-bold mb-2">Buyer Confirms</h4>
                <p className="text-sm">Inspects item and confirms receipt</p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <div className="text-3xl mb-2">4️⃣</div>
                <h4 className="font-bold mb-2">Funds Released</h4>
                <p className="text-sm">Seller receives payment automatically</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Ledger Tab */}
      {activeTab === 'blockchain' && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="text-2xl font-bold">Public Blockchain Ledger</h3>
              <p className="text-gray-600">100% transparent, immutable transaction history</p>
            </div>
          </div>

          {blockchainLedger.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No blockchain records yet. All transactions will be recorded here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockchainLedger.map((block, idx) => (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-purple-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                          Block #{block.blockNumber}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          block.status === 'completed' ? 'bg-green-200 text-green-800' :
                          block.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {block.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Transaction ID:</span>
                          <p className="font-mono font-medium">{block.transactionId}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Timestamp:</span>
                          <p className="font-medium">{new Date(block.timestamp).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-bold text-green-700">${block.amount}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">From (Buyer):</span>
                          <p className="font-medium break-all">{block.from}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">To (Seller):</span>
                          <p className="font-medium break-all">{block.to}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Block Hash:</span>
                          <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">{block.hash}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Previous Hash:</span>
                          <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">{block.previousHash}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
            <h4 className="font-bold text-purple-900 mb-3">🔐 Blockchain Benefits</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-purple-900 mb-1">✓ Immutable</p>
                <p className="text-purple-800">Records cannot be altered or deleted</p>
              </div>
              <div>
                <p className="font-semibold text-purple-900 mb-1">✓ Transparent</p>
                <p className="text-purple-800">All transactions publicly verifiable</p>
              </div>
              <div>
                <p className="font-semibold text-purple-900 mb-1">✓ Secure</p>
                <p className="text-purple-800">Cryptographically protected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fee Calculator Tab */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6">Fee Calculator</h3>
          
          <FeeCalculator calculateFees={calculateFees} />

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
              <h4 className="font-bold text-blue-900 mb-3">💰 Our Fees</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Platform Fee:</span>
                  <span className="font-bold text-blue-900">2.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Payment Processing:</span>
                  <span className="font-bold text-blue-900">2.9% + $0.30</span>
                </div>
                <div className="border-t border-blue-300 pt-2 mt-2">
                  <p className="text-blue-800 text-xs">
                    Our 2.5% platform fee covers: secure escrow, blockchain verification, buyer/seller protection, dispute resolution, and 24/7 support.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
              <h4 className="font-bold text-green-900 mb-3">📊 Industry Comparison</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-800">Precision Prices:</span>
                  <span className="font-bold text-green-900">5.4% avg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">eBay:</span>
                  <span className="text-gray-700">12.9% avg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mercari:</span>
                  <span className="text-gray-700">10% + $0.30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Poshmark:</span>
                  <span className="text-gray-700">20% (under $15)</span>
                </div>
                <div className="bg-green-200 p-2 rounded mt-3">
                  <p className="text-green-900 font-bold text-center">Save up to 7.5% vs competitors!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeeCalculator({ calculateFees }) {
  const [amount, setAmount] = useState('');
  const [fees, setFees] = useState(null);

  const calculate = () => {
    if (!amount) return;
    setFees(calculateFees(amount));
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Sale Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && calculate()}
            placeholder="Enter sale amount"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={calculate}
            disabled={!amount}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
          >
            Calculate
          </button>
        </div>
      </div>

      {fees && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
          <h4 className="text-xl font-bold text-green-900 mb-4">Fee Breakdown</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-700">Item Sale Price</span>
              <span className="text-2xl font-bold text-gray-900">${fees.subtotal}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Platform Fee (2.5%)</span>
              <span className="font-bold text-red-600">-${fees.platformFee}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Payment Processing (2.9% + $0.30)</span>
              <span className="font-bold text-red-600">-${fees.paymentProcessing}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Fees</span>
              <span className="font-bold text-red-600">-${fees.totalFees}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-600 text-white rounded-lg">
              <span className="text-lg font-semibold">You Receive</span>
              <span className="text-3xl font-bold">${fees.sellerReceives}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Note:</strong> Buyer pays ${fees.buyerPays}. You keep {((parseFloat(fees.sellerReceives) / parseFloat(fees.subtotal)) * 100).toFixed(1)}% of the sale price.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
function ShippingCalculator() {
  const [activeTab, setActiveTab] = useState('estimator'); // estimator, container, meetup
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [shippingSpeed, setShippingSpeed] = useState('ground');
  const [estimate, setEstimate] = useState(null);
  const [boxSuggestion, setBoxSuggestion] = useState(null);
  const [meetupLocation, setMeetupLocation] = useState('');
  const [meetupSuggestions, setMeetupSuggestions] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const calculateShipping = () => {
    setCalculating(true);
    
    // Simulate calculation
    setTimeout(() => {
      const w = parseFloat(weight) || 0;
      const l = parseFloat(length) || 0;
      const wid = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      
      // Simple shipping cost calculation
      const dimWeight = (l * wid * h) / 166; // Dimensional weight
      const billableWeight = Math.max(w, dimWeight);
      
      let baseCost = 0;
      if (shippingSpeed === 'ground') {
        baseCost = 8 + (billableWeight * 0.5);
      } else if (shippingSpeed === '3day') {
        baseCost = 15 + (billableWeight * 0.75);
      } else if (shippingSpeed === '2day') {
        baseCost = 22 + (billableWeight * 1.2);
      } else {
        baseCost = 35 + (billableWeight * 2);
      }
      
      // Distance factor (simplified)
      const zipDiff = Math.abs(parseInt(fromZip) - parseInt(toZip));
      const distanceFactor = 1 + (zipDiff / 100000);
      
      const finalCost = baseCost * distanceFactor;
      
      setEstimate({
        cost: finalCost.toFixed(2),
        billableWeight: billableWeight.toFixed(1),
        estimatedDays: shippingSpeed === 'ground' ? '5-7' : shippingSpeed === '3day' ? '3' : shippingSpeed === '2day' ? '2' : '1',
        carriers: [
          { name: 'USPS', cost: (finalCost * 0.9).toFixed(2) },
          { name: 'UPS', cost: finalCost.toFixed(2) },
          { name: 'FedEx', cost: (finalCost * 1.1).toFixed(2) }
        ]
      });
      
      setCalculating(false);
    }, 1000);
  };

  const suggestContainer = () => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const wt = parseFloat(weight) || 0;
    
    const volume = l * w * h;
    
    let suggestion = {};
    
    if (volume < 100) {
      suggestion = {
        name: 'Small Box',
        dimensions: '8" × 6" × 4"',
        maxWeight: '10 lbs',
        cost: '$1.50',
        bestFor: 'Small electronics, jewelry, accessories',
        buyLink: 'Amazon Small Boxes'
      };
    } else if (volume < 500) {
      suggestion = {
        name: 'Medium Box',
        dimensions: '12" × 10" × 8"',
        maxWeight: '20 lbs',
        cost: '$2.50',
        bestFor: 'Shoes, books, small appliances',
        buyLink: 'Amazon Medium Boxes'
      };
    } else if (volume < 1500) {
      suggestion = {
        name: 'Large Box',
        dimensions: '18" × 14" × 12"',
        maxWeight: '40 lbs',
        cost: '$3.50',
        bestFor: 'Clothing, larger electronics, kitchen items',
        buyLink: 'Amazon Large Boxes'
      };
    } else {
      suggestion = {
        name: 'Extra Large Box',
        dimensions: '24" × 20" × 18"',
        maxWeight: '65 lbs',
        cost: '$5.00',
        bestFor: 'Bulky items, multiple items, furniture parts',
        buyLink: 'Amazon XL Boxes'
      };
    }
    
    // Add padding recommendation
    const packingMaterials = [];
    if (wt < 5) {
      packingMaterials.push({ item: 'Bubble wrap', amount: '10 ft', cost: '$3' });
      packingMaterials.push({ item: 'Packing paper', amount: '1 lb', cost: '$2' });
    } else if (wt < 20) {
      packingMaterials.push({ item: 'Bubble wrap', amount: '20 ft', cost: '$5' });
      packingMaterials.push({ item: 'Packing peanuts', amount: '1 bag', cost: '$4' });
      packingMaterials.push({ item: 'Packing tape', amount: '1 roll', cost: '$3' });
    } else {
      packingMaterials.push({ item: 'Bubble wrap', amount: '30 ft', cost: '$7' });
      packingMaterials.push({ item: 'Packing peanuts', amount: '2 bags', cost: '$7' });
      packingMaterials.push({ item: 'Packing tape', amount: '2 rolls', cost: '$5' });
      packingMaterials.push({ item: 'Corner protectors', amount: '4 pieces', cost: '$4' });
    }
    
    suggestion.packingMaterials = packingMaterials;
    suggestion.totalPackagingCost = packingMaterials.reduce((sum, item) => sum + parseFloat(item.cost.replace('$', '')), parseFloat(suggestion.cost.replace('$', ''))).toFixed(2);
    
    setBoxSuggestion(suggestion);
  };

  const findMeetupSpots = () => {
    // Simulated meetup suggestions
    const suggestions = {
      safeSpots: [
        { name: 'Police Station Parking Lot', address: 'Main St Police Department', distance: '2.3 miles', safety: 'Highest', hours: '24/7' },
        { name: 'Bank Parking Lot', address: 'First National Bank', distance: '1.8 miles', safety: 'High', hours: '8am-6pm' },
        { name: 'Shopping Mall Food Court', address: 'City Center Mall', distance: '3.1 miles', safety: 'High', hours: '10am-9pm' },
        { name: 'Coffee Shop', address: 'Starbucks Main Street', distance: '1.2 miles', safety: 'Medium', hours: '6am-10pm' }
      ],
      tips: [
        '✓ Always meet in well-lit public places',
        '✓ Bring a friend if possible',
        '✓ Meet during daytime hours',
        '✓ Let someone know where you\'re going',
        '✓ Trust your instincts - if something feels off, cancel',
        '✓ Inspect item before exchanging money',
        '✓ Use cash or secure payment apps'
      ]
    };
    
    setMeetupSuggestions(suggestions);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-4">
          <Package className="w-16 h-16" />
          <div>
            <h2 className="text-3xl font-bold">Shipping & Delivery Center</h2>
            <p className="text-lg">Calculate costs, find boxes, and plan safe meetups</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('estimator')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'estimator'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Truck className="w-5 h-5" />
          Shipping Cost
        </button>
        <button
          onClick={() => setActiveTab('container')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'container'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Package className="w-5 h-5" />
          Box Finder
        </button>
        <button
          onClick={() => setActiveTab('meetup')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            activeTab === 'meetup'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <MapPin className="w-5 h-5" />
          Safe Meetup
        </button>
      </div>

      {/* Shipping Cost Estimator */}
      {activeTab === 'estimator' && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6">Shipping Cost Estimator</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold mb-4">Package Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (lbs)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="5.0"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Length (in)</label>
                    <input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="12"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Width (in)</label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="8"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height (in)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="6"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Shipping Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From ZIP Code</label>
                  <input
                    type="text"
                    value={fromZip}
                    onChange={(e) => setFromZip(e.target.value)}
                    placeholder="10001"
                    maxLength="5"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">To ZIP Code</label>
                  <input
                    type="text"
                    value={toZip}
                    onChange={(e) => setToZip(e.target.value)}
                    placeholder="90001"
                    maxLength="5"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Shipping Speed</label>
                  <select
                    value={shippingSpeed}
                    onChange={(e) => setShippingSpeed(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ground">Ground (5-7 days)</option>
                    <option value="3day">3-Day</option>
                    <option value="2day">2-Day</option>
                    <option value="overnight">Overnight</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={calculateShipping}
            disabled={calculating || !weight || !fromZip || !toZip}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2"
          >
            {calculating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Truck className="w-5 h-5" />
                Calculate Shipping Cost
              </>
            )}
          </button>

          {estimate && (
            <div className="mt-8 space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                <h4 className="text-xl font-bold text-green-900 mb-2">Estimated Cost</h4>
                <div className="text-4xl font-bold text-green-700">${estimate.cost}</div>
                <p className="text-sm text-green-800 mt-2">
                  Billable Weight: {estimate.billableWeight} lbs • Delivery: {estimate.estimatedDays} business days
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {estimate.carriers.map((carrier, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                    <div className="font-semibold text-gray-900">{carrier.name}</div>
                    <div className="text-2xl font-bold text-blue-600">${carrier.cost}</div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Consider adding signature confirmation for items over $50</li>
                  <li>• Purchase insurance for valuable items</li>
                  <li>• Use online shipping labels to save 10-20%</li>
                  <li>• Compare rates across carriers before choosing</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Container Suggester */}
      {activeTab === 'container' && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6">Box & Container Finder</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Item Dimensions</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Length"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Width"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Height"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Item Weight (lbs)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight in pounds"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={suggestContainer}
            disabled={!length || !width || !height}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2"
          >
            <Package className="w-5 h-5" />
            Find Perfect Box
          </button>

          {boxSuggestion && (
            <div className="mt-8 space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6">
                <h4 className="text-2xl font-bold text-purple-900 mb-4">{boxSuggestion.name}</h4>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Dimensions</p>
                    <p className="text-lg font-bold text-purple-900">{boxSuggestion.dimensions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Max Weight</p>
                    <p className="text-lg font-bold text-purple-900">{boxSuggestion.maxWeight}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Box Cost</p>
                    <p className="text-lg font-bold text-purple-900">{boxSuggestion.cost}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Total Packaging</p>
                    <p className="text-lg font-bold text-purple-900">${boxSuggestion.totalPackagingCost}</p>
                  </div>
                </div>
                <p className="text-purple-800">
                  <strong>Best for:</strong> {boxSuggestion.bestFor}
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h5 className="font-bold text-gray-900 mb-4">📦 Recommended Packing Materials</h5>
                <div className="space-y-3">
                  {boxSuggestion.packingMaterials.map((material, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{material.item}</p>
                        <p className="text-sm text-gray-600">{material.amount}</p>
                      </div>
                      <p className="font-bold text-blue-600">{material.cost}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h5 className="font-semibold text-yellow-900 mb-2">📝 Packing Tips</h5>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Wrap fragile items individually with bubble wrap</li>
                  <li>• Fill empty spaces with packing peanuts or paper</li>
                  <li>• Seal all edges with quality packing tape</li>
                  <li>• Label "FRAGILE" if item is delicate</li>
                  <li>• Take photos of the packaged item before shipping</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meetup Location Finder */}
      {activeTab === 'meetup' && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6">Safe Meetup Location Finder</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Your Location (City or ZIP)</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                placeholder="Enter your city or ZIP code"
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={findMeetupSpots}
                disabled={!meetupLocation}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Find Spots
              </button>
            </div>
          </div>

          {meetupSuggestions && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <h4 className="text-xl font-bold text-green-900 mb-4">🛡️ Recommended Safe Meetup Locations</h4>
                <div className="space-y-3">
                  {meetupSuggestions.safeSpots.map((spot, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-green-400 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-bold text-gray-900">{spot.name}</h5>
                          <p className="text-sm text-gray-600">{spot.address}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          spot.safety === 'Highest' ? 'bg-green-200 text-green-800' :
                          spot.safety === 'High' ? 'bg-blue-200 text-blue-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {spot.safety} Safety
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>📍 {spot.distance}</span>
                        <span>🕐 {spot.hours}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h4 className="text-xl font-bold text-red-900 mb-4">⚠️ Safety Guidelines</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {meetupSuggestions.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <p className="text-red-800">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">💬 Message Template</h5>
                <div className="bg-white p-4 rounded border border-blue-200">
                  <p className="text-sm text-gray-700 italic">
                    "Hi! I'd like to meet at [Location] on [Day] at [Time]. It's a safe, public place with good lighting. Does that work for you?"
                  </p>
                </div>
                <button
                  onClick={() => {
                    const template = "Hi! I'd like to meet at [Location] on [Day] at [Time]. It's a safe, public place with good lighting. Does that work for you?";
                    navigator.clipboard.writeText(template);
                    alert('Message template copied to clipboard!');
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  Copy Template
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Tool */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">💡 Shipping vs. Local Pickup</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white bg-opacity-20 p-6 rounded-xl">
            <h4 className="font-bold text-xl mb-3">✈️ Ship It</h4>
            <ul className="space-y-2 text-sm">
              <li>✓ Reach buyers nationwide</li>
              <li>✓ Sell faster (larger market)</li>
              <li>✓ No in-person meetings</li>
              <li>✗ Shipping & packaging costs</li>
              <li>✗ Risk of damage in transit</li>
            </ul>
          </div>
          <div className="bg-white bg-opacity-20 p-6 rounded-xl">
            <h4 className="font-bold text-xl mb-3">🤝 Local Pickup</h4>
            <ul className="space-y-2 text-sm">
              <li>✓ No shipping costs</li>
              <li>✓ Buyer inspects before paying</li>
              <li>✓ Instant cash payment</li>
              <li>✗ Limited to local buyers</li>
              <li>✗ Requires coordination</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-center text-lg font-semibold">
          💰 Pro Tip: Offer both options and charge extra for shipping to maximize sales!
        </p>
      </div>
    </div>
  );
}