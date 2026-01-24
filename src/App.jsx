/**
 * Precision Prices
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, DollarSign, TrendingUp, AlertCircle, Loader2, Upload, X, ThumbsUp, ThumbsDown, CheckCircle, BarChart3, Home, Trophy, Zap, MessageSquare, MessageCircle, Award, Star, TrendingDown, Share2, AlertTriangle, Send, Edit2, Save, Package, Truck, MapPin, Navigation, Lock, Shield, CreditCard, History, LogOut, Download, Users, Copy, ExternalLink, Link } from 'lucide-react';
import { InputValidation } from './fuzz-tests';
import { useAuth } from './AuthContext';
import AuthPage from './AuthPage';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import './storage'; // Cross-browser storage wrapper
import { parseLocation, getLocationDescription, getLocationPricingInsight } from './locationData';
import BullseyePriceTarget from './components/BullseyePriceTarget';
import { getComparableItems, blendPricing, formatPricingInsights } from './pricingIntelligence';
import heic2any from 'heic2any';
import { useFeedbackSystem } from './hooks/useFeedbackSystem';
import MicroFeedback from './components/MicroFeedback';
import TransactionOutcome from './components/TransactionOutcome';
import FeedbackDashboard from './components/FeedbackDashboard';
import FacebookMarketplaceButton from './components/FacebookMarketplaceButton';
import AuthGateModal from './components/AuthGateModal';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import MarketSearch from './components/MarketSearch';
import TrendingItems from './components/TrendingItems';
import CommunitySales from './components/CommunitySales';

// Badge System - 5 Levels of Achievement
const BADGES = {
  // Level 1 — Onboarding & Early Wins (Confidence Builders)
  'getting-started': { name: 'Getting Started', icon: '🚀', desc: 'Completed your first price analysis', level: 1, requirement: (p) => p.analysisCount >= 1 },
  'market-explorer': { name: 'Market Explorer', icon: '🧭', desc: 'Analyzed 3 items', level: 1, requirement: (p) => p.analysisCount >= 3 },
  'first-flip': { name: 'First Flip', icon: '💰', desc: 'Sold your first item using an AI price', level: 1, requirement: (p) => p.itemsSold >= 1 },
  'quick-learner': { name: 'Quick Learner', icon: '⚡', desc: 'Completed 3 analyses in one day', level: 1, requirement: (p) => p.analysesInOneDay >= 3 },
  'streak-starter': { name: 'Streak Starter', icon: '🔥', desc: 'Used the app 3 days in a row', level: 1, requirement: (p) => p.streak >= 3 },

  // Level 2 — Engagement & Habit Formation
  'power-user': { name: 'Power User', icon: '📊', desc: 'Analyzed 10 items', level: 2, requirement: (p) => p.analysisCount >= 10 },
  'dialed-in': { name: 'Dialed In', icon: '🎯', desc: 'Achieved price accuracy within 5% (3 times)', level: 2, requirement: (p) => p.accurateCount >= 3 },
  'listing-pro': { name: 'Listing Pro', icon: '📸', desc: 'Uploaded photos for 10 items', level: 2, requirement: (p) => p.photosUploaded >= 10 },
  'speed-seller': { name: 'Speed Seller', icon: '⏱️', desc: 'Sold an item within 48 hours of listing', level: 2, requirement: (p) => p.quickSales >= 1 },
  'consistent': { name: 'Consistent', icon: '🔥', desc: '7-day usage streak', level: 2, requirement: (p) => p.streak >= 7 },

  // Level 3 — Skill & Performance
  'perfect-pricer': { name: 'Perfect Pricer', icon: '🎖️', desc: 'Achieved price accuracy within 5% (5 times)', level: 3, requirement: (p) => p.accurateCount >= 5 },
  'market-reader': { name: 'Market Reader', icon: '📈', desc: 'Adjusted prices and improved sale speed', level: 3, requirement: (p) => p.priceAdjustments >= 3 },
  'side-hustler': { name: 'Side Hustler', icon: '💸', desc: 'Earned $250 extra using AI pricing', level: 3, requirement: (p) => p.totalEarnings >= 250 },
  'data-driven': { name: 'Data-Driven', icon: '🧠', desc: 'Used insights to optimize 10 listings', level: 3, requirement: (p) => p.insightsUsed >= 10 },
  'repeat-seller': { name: 'Repeat Seller', icon: '🔁', desc: 'Sold 5 items total', level: 3, requirement: (p) => p.itemsSold >= 5 },

  // Level 4 — Monetization & Mastery
  'big-earner': { name: 'Big Earner', icon: '💎', desc: 'Earned $1,000 extra', level: 4, requirement: (p) => p.totalEarnings >= 1000 },
  'volume-seller': { name: 'Volume Seller', icon: '📦', desc: 'Sold 20 items', level: 4, requirement: (p) => p.itemsSold >= 20 },
  'price-strategist': { name: 'Price Strategist', icon: '📉', desc: 'Optimized prices based on demand trends', level: 4, requirement: (p) => p.strategicPricing >= 5 },
  'sniper': { name: 'Sniper', icon: '🎯', desc: 'Hit 5% accuracy on 3 consecutive listings', level: 4, requirement: (p) => p.consecutiveAccurate >= 3 },
  'on-fire': { name: 'On Fire', icon: '🔥', desc: '14-day streak', level: 4, requirement: (p) => p.streak >= 14 },

  // Level 5 — Authority & Power User Status
  'market-master': { name: 'Market Master', icon: '👑', desc: 'Earned $5,000+ using AI pricing', level: 5, requirement: (p) => p.totalEarnings >= 5000 },
  'pricing-savant': { name: 'Pricing Savant', icon: '🏆', desc: 'Maintained 5% accuracy across 20 listings', level: 5, requirement: (p) => p.accurateCount >= 20 },
  'marketplace-insider': { name: 'Marketplace Insider', icon: '📊', desc: 'Used advanced pricing insights', level: 5, requirement: (p) => p.advancedInsights >= 10 },
  'scaling-up': { name: 'Scaling Up', icon: '🚀', desc: 'Sold 50+ items', level: 5, requirement: (p) => p.itemsSold >= 50 },
  'trusted-seller': { name: 'Trusted Seller', icon: '🌟', desc: 'High sell-through rate + repeat buyers', level: 5, requirement: (p) => p.itemsSold >= 25 && p.accurateCount >= 15 }
};

// Helper function to compress images using canvas
async function compressImageBlob(blob, quality = 0.7, maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if too large
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Canvas compression failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(blob);
  });
}

export default function MarketplacePricer() {
  const { saveItemToHistory, logout, currentUser, isGuestMode } = useAuth();
  const { sessionData, currentListingId, createListingRecord, handleFeedbackSubmit } = useFeedbackSystem();
  const routerLocation = useLocation();
  const [view, setView] = useState('pricing');
  const [mainTab, setMainTab] = useState('home');
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' or 'bulk'
  const [stats, setStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [itemName, setItemName] = useState('');
  const [condition, setCondition] = useState('good');
  const [location, setLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [formKey, setFormKey] = useState(0); // Key to force form reset
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authGateFromLogout, setAuthGateFromLogout] = useState(false);
  const resultsRef = useRef(null);
  const [userZipCode, setUserZipCode] = useState('');
  const [searchRadius, setSearchRadius] = useState(25);
  const [showPricingTool, setShowPricingTool] = useState(false);


  useEffect(() => {
    loadUserProfile();
    if (view === 'dashboard') loadStats();
    if (view === 'pricing') {
      loadStats(); // Refresh stats when returning to home
    }

    // Update mainTab based on current view
    if (view === 'pricing') setMainTab('home');
    else if (['dashboard', 'history', 'achievements', 'leaderboard', 'feedback-dashboard'].includes(view)) setMainTab('dashboard');
    else if (['shipping'].includes(view)) setMainTab('tools');
    else if (view === 'subscription') setMainTab('subscription');
  }, [view]);

  // Auto-close auth gate when user signs in
  useEffect(() => {
    if (currentUser && showAuthGate) {
      setShowAuthGate(false);
      setAuthGateFromLogout(false);
    }
  }, [currentUser, showAuthGate]);

  // Handle return from listing page - restore analysis to allow feedback
  useEffect(() => {
    if (routerLocation.state?.returnFromListing && routerLocation.state?.listingData) {
      const listingData = routerLocation.state.listingData;

      // Reconstruct the analysis result from the listing data
      const restoredResult = {
        itemIdentification: listingData.itemIdentification,
        pricingStrategy: listingData.pricingStrategy,
        marketInsights: listingData.marketInsights,
        suggestedPriceRange: listingData.suggestedPriceRange,
        optimizationTips: listingData.optimizationTips,
        comparableItems: listingData.comparableItems,
      };

      setResult(restoredResult);
      setShowFeedback(true);
      setFeedbackSubmitted(false);
      setView('pricing');

      // Restore images if available
      if (listingData.images && listingData.images.length > 0) {
        const restoredImages = listingData.images.map((img, idx) => ({
          preview: img,
          file: null // Original file not available
        }));
        setImages(restoredImages);
      }

      // Restore item details
      if (listingData.itemIdentification?.name) {
        setItemName(listingData.itemIdentification.name);
      }
      if (listingData.condition) {
        setCondition(listingData.condition);
      }
      if (listingData.location) {
        setLocation(listingData.location);
      }
      if (listingData.additionalDetails) {
        setAdditionalDetails(listingData.additionalDetails);
      }

      // Scroll to results after a short delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      // Clear the state to prevent re-triggering on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [routerLocation.state]);

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

    // Initialize new tracking fields if missing
    if (!updated.itemsSold) updated.itemsSold = 0;
    if (!updated.accurateCount) updated.accurateCount = 0;
    if (!updated.photosUploaded) updated.photosUploaded = 0;
    if (!updated.quickSales) updated.quickSales = 0;
    if (!updated.priceAdjustments) updated.priceAdjustments = 0;
    if (!updated.insightsUsed) updated.insightsUsed = 0;
    if (!updated.strategicPricing) updated.strategicPricing = 0;
    if (!updated.consecutiveAccurate) updated.consecutiveAccurate = 0;
    if (!updated.advancedInsights) updated.advancedInsights = 0;
    if (!updated.analysesInOneDay) updated.analysesInOneDay = 0;

    // Check all badges for new unlocks
    const newBadges = [];
    Object.keys(BADGES).forEach(badgeId => {
      const badge = BADGES[badgeId];
      if (!updated.badges.includes(badgeId) && badge.requirement(updated)) {
        newBadges.push({ id: badgeId, ...badge });
      }
    });

    if (newBadges.length > 0) {
      updated.badges = [...updated.badges, ...newBadges.map(b => b.id)];

      // Update user level based on badges earned
      const level1Count = updated.badges.filter(b => BADGES[b]?.level === 1).length;
      const level2Count = updated.badges.filter(b => BADGES[b]?.level === 2).length;
      const level3Count = updated.badges.filter(b => BADGES[b]?.level === 3).length;
      const level4Count = updated.badges.filter(b => BADGES[b]?.level === 4).length;
      const level5Count = updated.badges.filter(b => BADGES[b]?.level === 5).length;

      if (level5Count >= 3) updated.level = 5;
      else if (level4Count >= 3) updated.level = 4;
      else if (level3Count >= 3) updated.level = 3;
      else if (level2Count >= 3) updated.level = 2;
      else updated.level = 1;

      // Show badge notifications
      newBadges.forEach((badge, index) => {
        setTimeout(() => {
          alert(`🎉 New Badge Unlocked!\n\n${badge.icon} ${badge.name}\n${badge.desc}\n\nLevel ${badge.level} Achievement`);
        }, 500 * (index + 1));
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
      setStats({ total: 0, sold: 0, accuracy: 0, recent: [] });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const errors = [];
    const validFiles = [];

    files.forEach(file => {
      // Use existing validation utility
      const validation = InputValidation.validateImageFile(file);

      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
      } else if (file.size <= 10 * 1024 * 1024) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: file too large`);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('; '));
    }

    const newImages = validFiles.slice(0, 5 - images.length);

    // Show loading indicator for all image uploads
    setImageLoading(true);

    // Check if any files need HEIC conversion
    const hasHEIC = newImages.some(file =>
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.type === 'image/heic-sequence' ||
      file.type === 'image/heif-sequence' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    );

    // Process images: Convert HEIC to JPEG for API compatibility (Anthropic only supports jpeg/png/gif/webp)
    const processPromises = newImages.map(async (file) => {
      try {
        const isHEIC = file.type === 'image/heic' ||
                       file.type === 'image/heif' ||
                       file.type === 'image/heic-sequence' ||
                       file.type === 'image/heif-sequence' ||
                       file.name.toLowerCase().endsWith('.heic') ||
                       file.name.toLowerCase().endsWith('.heif');

        let uploadFile = file;

        if (isHEIC) {
          // Convert HEIC to JPEG (required by Anthropic API)
          try {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.6  // Lower quality to reduce file size
            });

            let blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            // Compress further if still > 2MB
            if (blob.size > 2 * 1024 * 1024) {
              blob = await compressImageBlob(blob, 0.7, 1920);
            }

            uploadFile = new File(
              [blob],
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            );
          } catch (conversionError) {
            console.error('HEIC conversion failed:', conversionError);
            throw new Error(`${file.name}: HEIC conversion failed. Please try a different photo format.`);
          }
        } else if (file.size > 2 * 1024 * 1024) {
          // Compress large non-HEIC images
          try {
            const compressed = await compressImageBlob(file, 0.7, 1920);
            uploadFile = new File([compressed], file.name, { type: file.type });
          } catch (compressError) {
            // Compression failed, use original file
          }
        }

        // Read file to dataURL for both preview and upload
        const dataURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });

        return { file: uploadFile, preview: dataURL };
      } catch (err) {
        throw new Error(`${file.name}: ${err.message || 'Processing failed'}`);
      }
    });

    // Wait for all conversions to complete and update state once
    try {
      const processedImages = await Promise.all(processPromises);
      setImages(prev => [...prev, ...processedImages]);

      // Track photos uploaded for badges
      if (userProfile) {
        await updateUserProfile({ photosUploaded: (userProfile.photosUploaded || 0) + processedImages.length });
      }
    } catch (err) {
      errors.push(err.message);
      setError(errors.join('; '));
    } finally {
      setImageLoading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePricing = async () => {
    // Check if guest user has exceeded 2 attempts
    if (isGuestMode && userProfile) {
      const guestAttempts = userProfile.guestAttempts || 0;

      if (guestAttempts >= 2) {
        setShowAuthGate(true);
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

        // Detect actual image type from base64 magic bytes (more reliable than file.type on iOS)
        // Anthropic API only supports: image/jpeg, image/png, image/gif, image/webp
        const detectImageType = (base64) => {
          // Decode first few bytes to check magic numbers
          const header = atob(base64.substring(0, 16));
          const bytes = new Uint8Array([...header].map(c => c.charCodeAt(0)));

          // PNG: 89 50 4E 47 (‰PNG)
          if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return 'image/png';
          }
          // JPEG: FF D8 FF
          if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return 'image/jpeg';
          }
          // GIF: 47 49 46 38 (GIF8)
          if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            return 'image/gif';
          }
          // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
          if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
              bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
            return 'image/webp';
          }
          // Default to JPEG (safest fallback, most common)
          return 'image/jpeg';
        };

        const mediaType = detectImageType(base64Data);

        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64Data }
        });
      }

      // Parse location for regional pricing intelligence
      const locationData = parseLocation(location);
      const locationDesc = getLocationDescription(locationData);
      const locationInsight = getLocationPricingInsight(locationData);

      // Query our proprietary database for comparable sold prices
      // Note: We don't know the category yet (Claude will identify it), so we'll enhance post-Claude
      // For now, try to guess category from item name
      let realPricingData = null;
      try {
        // Simple category detection (will be replaced with Claude's more accurate identification)
        const itemNameLower = (itemName || '').toLowerCase();
        let guessedCategory = 'general';
        if (itemNameLower.includes('iphone') || itemNameLower.includes('phone') || itemNameLower.includes('samsung')) {
          guessedCategory = 'Electronics';
        } else if (itemNameLower.includes('chair') || itemNameLower.includes('table') || itemNameLower.includes('sofa')) {
          guessedCategory = 'Furniture';
        } else if (itemNameLower.includes('nike') || itemNameLower.includes('shirt') || itemNameLower.includes('shoes')) {
          guessedCategory = 'Clothing';
        }

        realPricingData = await getComparableItems(itemName, guessedCategory, locationData);
      } catch (e) {
        // Database query failed - continue with AI-only pricing
      }

      // Get current date for seasonal context
      const currentDate = new Date();
      const season = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'][currentDate.getMonth()];
      const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      let prompt = `You are a marketplace pricing expert specializing in Facebook Marketplace. Analyze this item for accurate local pricing.`;
      if (images.length > 0) prompt += `\n\nAnalyze the ${images.length} image(s) to identify the item, assess its condition from multiple angles, and identify any notable features or flaws that affect value.`;

      prompt += `\n\n=== ITEM INFORMATION ===\nItem Name: ${itemName || 'Not specified'}\nCondition: ${condition}\nLocation: ${location || 'Not specified'}\nAdditional Details: ${additionalDetails || 'None'}`;

      // Add location-based pricing context
      prompt += `\n\n=== LOCATION MARKET ANALYSIS ===\n`;
      prompt += `Selling Location: ${locationDesc}\n`;
      prompt += `Regional Market Factor: ${locationData.multiplier}x national average\n`;
      prompt += `Market Insight: ${locationInsight}\n`;
      prompt += `Demand Level: ${locationData.demand}\n`;
      if (locationData.metro) {
        prompt += `Metro Area: ${locationData.metro}\n`;
      }

      // Add real sold price data if available
      if (realPricingData && realPricingData.count >= 3) {
        prompt += `\n=== REAL MARKET DATA (PROPRIETARY DATABASE) ===\n`;
        prompt += `We have ${realPricingData.count} similar items sold ${realPricingData.geographicScope === 'local' ? 'in this area' : realPricingData.geographicScope === 'regional' ? 'in this region' : 'nationally'}:\n`;
        prompt += `Average Sold Price: $${realPricingData.avgPrice}\n`;
        prompt += `Price Range: $${realPricingData.min} - $${realPricingData.max}\n`;
        prompt += `Median Price: $${realPricingData.median}\n`;
        if (realPricingData.avgDaysToSell) {
          prompt += `Average Time to Sell: ${realPricingData.avgDaysToSell} days\n`;
        }
        prompt += `\nIMPORTANT: Use this real market data as your PRIMARY pricing guide. Adjust for condition and specific features, but anchor your pricing to these actual sold prices.\n`;
      }

      // Add seasonal context
      prompt += `\n=== SEASONAL CONTEXT ===\n`;
      prompt += `Current Period: ${currentMonth} (${season})\n`;
      prompt += `Consider seasonal demand factors for this item category.\n`;

      prompt += `\n\nIMPORTANT PRICING GUIDELINES:
1. Adjust prices based on the regional market multiplier (${locationData.multiplier}x)
2. Consider that ${locationDesc} has ${locationData.demand} demand conditions
3. Account for ${season} seasonal factors relevant to this item
4. Provide confidence score (0-100) based on how certain you are about this pricing
5. For high-value markets, buyers expect quality and are willing to pay premium prices
6. For value markets, price competitively to move items quickly

You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks. Just pure JSON.

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
  "locationFactors": {
    "regionalMultiplier": ${locationData.multiplier},
    "marketType": "${locationDesc}",
    "localDemand": "${locationData.demand}"
  },
  "confidenceScore": number,
  "optimizationTips": ["string", "string"],
  "comparableItems": [{"description": "string", "typicalPrice": number}],
  "imageAnalysis": "string"
}`;

      contentParts.push({ type: 'text', text: prompt });

      // Call our backend server instead of Anthropic directly
      // Use environment variable for backend URL, fallback to current hostname in dev
      const apiUrl = import.meta.env.VITE_BACKEND_URL
        ? `${import.meta.env.VITE_BACKEND_URL}/api/analyze`
        : import.meta.env.DEV
        ? `http://${window.location.hostname}:3001/api/analyze`
        : '/api/analyze';

      // Create abort controller for timeout (180 seconds for mobile photo uploads)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      let response;
      let retryCount = 0;
      const maxRetries = 2;

      // Retry logic with exponential backoff
      while (retryCount <= maxRetries) {
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: contentParts }]
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          break; // Success, exit retry loop
        } catch (fetchErr) {
          retryCount++;
          if (fetchErr.name === 'AbortError' || retryCount > maxRetries) {
            throw fetchErr; // Don't retry timeout or if max retries exceeded
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }

      try {

        if (!response.ok) {
          const errorData = await response.json();

          // Handle prohibited content errors with simple message
          if (errorData.error?.type === 'prohibited_content') {
            throw new Error(errorData.error.message);
          }

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

          // Check if all prices are zero (item not suitable for resale)
          const allZero = prices.every(p => p === 0);

          if (allZero) {
            // Item has no resale value - show the reasoning to user
            const reasoning = parsedResult.pricingStrategy?.reasoning ||
                            'This item appears to have no marketplace value.';
            throw new Error(`Not suitable for resale: ${reasoning}`);
          }

          // Validate all prices are positive numbers
          const invalidPrices = prices.filter(p =>
            typeof p !== 'number' || isNaN(p) || p < 0 || p > 1000000
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

        // Add parsed location data to result
        parsedResult.locationData = locationData;

        // HYBRID PRICING: Blend AI response with real database pricing if available
        if (realPricingData && realPricingData.count >= 3) {
          addDebugLog('info', `Blending AI pricing with ${realPricingData.count} real data points`);

          const aiPricing = {
            min: parsedResult.suggestedPriceRange.min,
            max: parsedResult.suggestedPriceRange.max,
            optimal: parsedResult.suggestedPriceRange.optimal
          };

          // Blend AI pricing with real market data (70% real, 30% AI)
          const blendedPricing = blendPricing(aiPricing, realPricingData);

          // Update result with blended pricing
          parsedResult.suggestedPriceRange = {
            min: blendedPricing.min,
            max: blendedPricing.max,
            optimal: blendedPricing.optimal
          };
          parsedResult.confidenceScore = blendedPricing.confidenceScore;
          parsedResult.dataSource = blendedPricing.dataSource;
          parsedResult.dataCount = blendedPricing.dataCount;
          parsedResult.geographicScope = blendedPricing.geographicScope;
          parsedResult.avgDaysToSell = blendedPricing.avgDaysToSell;
          parsedResult.pricingInsights = formatPricingInsights(realPricingData, locationData);

          addDebugLog('success', `Hybrid pricing: $${blendedPricing.optimal} (confidence: ${blendedPricing.confidenceScore}%)`);
        } else if (realPricingData) {
          // Some data but not enough for blending
          parsedResult.dataCount = realPricingData.count;
          parsedResult.dataSource = 'AI_with_limited_data';
          parsedResult.pricingInsights = formatPricingInsights(realPricingData, locationData);
        } else {
          // No real data available
          parsedResult.dataCount = 0;
          parsedResult.dataSource = 'AI_only';
        }

        setResult(parsedResult);
        setShowFeedback(true);

        // Create listing record for feedback tracking
        if (createListingRecord) {
          createListingRecord(parsedResult).catch(() => {
            // Could not create listing record - continue anyway
          });
        }

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
        const updates = {
          analysisCount: (userProfile?.analysisCount || 0) + 1
        };

        // Track guest attempts separately
        if (isGuestMode) {
          updates.guestAttempts = (userProfile?.guestAttempts || 0) + 1;
        }

        await updateUserProfile(updates);
      } catch (parseError) {
        // Create detailed error with parse information
        const detailedError = new Error('Could not parse pricing data. Please try again.');
        detailedError.originalError = parseError.message;
        detailedError.parseAttempt = jsonMatch[0].substring(0, 500); // First 500 chars
        throw detailedError;
      }
      } catch (fetchError) {
        // Handle timeout and network errors
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 3 minutes. Please check your internet connection and try again. If the issue persists, try with fewer photos.');
        }
        throw fetchError;
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze pricing');

      // Automatically log error to Firebase (no user interaction needed)
      const autoBugReport = {
        description: 'Automatic error report from analyzePricing function',
        error: err.message || 'Unknown error',
        errorStack: err.stack || 'No stack trace',
        originalError: err.originalError || null,
        parseAttempt: err.parseAttempt || null,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userId: currentUser?.uid || 'guest',
        userEmail: currentUser?.email || 'guest',
        isGuestMode: isGuestMode,
        resolved: false,
        url: window.location.href,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        itemContext: {
          itemName: itemName || 'none',
          location: location || 'none',
          hasImages: images.length > 0,
          condition: condition || 'none',
          additionalDetails: additionalDetails ? additionalDetails.substring(0, 100) : 'none'
        }
      };

      // Send to Firebase silently in background
      try {
        await addDoc(collection(db, 'bugReports'), autoBugReport);
      } catch (firebaseError) {
        // Fallback to localStorage
        try {
          let bugs = [];
          const stored = await window.storage.get('bugreports', true);
          if (stored && stored.value) bugs = JSON.parse(stored.value);
          bugs.push(autoBugReport);
          await window.storage.set('bugreports', JSON.stringify(bugs), true);
        } catch (e) {
          // Failed to save bug report - continue anyway
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (wasFair, wasSold, actualPrice, feedback, daysToSell = null) => {
    try {
      const feedbackData = {
        itemName: result?.itemIdentification?.name || itemName,
        suggestedPrice: result?.suggestedPriceRange?.optimal,
        wasFair, wasSold,
        actualPrice: actualPrice || null,
        feedback,
        daysToSell: daysToSell,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage for backward compatibility
      let allFeedback = [];
      try {
        const stored = await window.storage.get('pricingfeedback');
        if (stored && stored.value) allFeedback = JSON.parse(stored.value);
      } catch (e) {}

      allFeedback.push(feedbackData);
      await window.storage.set('pricingfeedback', JSON.stringify(allFeedback));

      // If sold, save to Firebase soldPrices collection for proprietary database
      if (wasSold && actualPrice && result) {
        try {
          const locationData = parseLocation(location);

          const soldPriceData = {
            // Item details
            itemName: result.itemIdentification?.name || itemName,
            category: result.itemIdentification?.category || 'uncategorized',
            brand: result.itemIdentification?.brand || null,
            condition: condition,

            // Pricing data
            suggestedPrice: result.suggestedPriceRange?.optimal || null,
            suggestedMin: result.suggestedPriceRange?.min || null,
            suggestedMax: result.suggestedPriceRange?.max || null,
            actualSoldPrice: actualPrice,

            // Location for regional pricing intelligence
            location: {
              raw: location || 'not specified',
              parsed: {
                city: locationData.city,
                state: locationData.state,
                zipCode: locationData.zipCode || null,
                metro: locationData.metro || null,
                multiplier: locationData.multiplier
              }
            },

            // Timing and accuracy
            timestamp: new Date(),
            daysToSell: daysToSell,
            wasAccurate: Math.abs(actualPrice - result.suggestedPriceRange.optimal) / actualPrice < 0.10, // Within 10%
            priceDifference: actualPrice - result.suggestedPriceRange.optimal,

            // User info
            userId: currentUser?.uid || 'guest',
            userEmail: currentUser?.email || 'guest',
            isGuestMode: isGuestMode,

            // Metadata
            metadata: {
              hasImages: images.length > 0,
              imageCount: images.length,
              confidenceScore: result.confidenceScore || null,
              feedback: feedback || null
            }
          };

          // Save to Firebase
          await addDoc(collection(db, 'soldPrices'), soldPriceData);
        } catch (firebaseError) {
          // Don't fail the whole feedback submission if Firebase fails
        }
      }

      // Update user achievements - Use actual sale price as earnings
      if (wasSold && actualPrice && result?.suggestedPriceRange) {
        const earningSaved = Math.abs(actualPrice);
        const isPerfectPrice = Math.abs(actualPrice - result.suggestedPriceRange.optimal) / actualPrice < 0.05;

        const currentEarnings = userProfile?.totalEarnings || 0;
        const currentPerfectPrices = userProfile?.perfectPrices || 0;
        const currentContributions = userProfile?.dataContributions || 0;

        await updateUserProfile({
          totalEarnings: currentEarnings + earningSaved,
          perfectPrices: isPerfectPrice ? currentPerfectPrices + 1 : currentPerfectPrices,
          dataContributions: currentContributions + 1 // Track contributions to database
        });

        // Check for earnings milestones
        if (currentEarnings + earningSaved >= 1000 && currentEarnings < 1000) {
          alert('🎉 Achievement Unlocked: Big Earner - $1,000 in extra earnings!');
        }

        // Check for contribution badges
        if (currentContributions + 1 === 5) {
          alert('🏆 Badge Earned: Data Hero - You have contributed 5 sold prices to help the community!');
        } else if (currentContributions + 1 === 25) {
          alert('🌟 Badge Earned: Market Insider - You have contributed 25 sold prices! You are a pricing expert!');
        }
      }

      setFeedbackSubmitted(true);

      // Reload stats to show updated earnings
      if (view === 'dashboard') {
        await loadStats();
      }
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <nav className="bg-gradient-to-r from-emerald-600 to-green-600 shadow-2xl border-b-4 border-emerald-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
              <div className="bg-white p-1.5 sm:p-2 rounded-2xl shadow-lg flex-shrink-0">
                <img src="/logo.png" alt="Precision Prices Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              </div>
              <div className="text-white flex-1 md:flex-initial">
                <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-1 sm:gap-2">
                  <span>Precision Prices</span>
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                </h1>
                {userProfile && (
                  <p className="text-[10px] sm:text-xs text-emerald-100 truncate">Level {userProfile.level} • {userProfile.badges.length} Badges</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap items-center justify-center w-full md:w-auto">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
                { id: 'tools', icon: Package, label: 'Tools' }
                // STRIPE TEMPORARILY DISABLED - Uncomment when ready to go live
                // { id: 'subscription', icon: CreditCard, label: 'Subscription' }
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
                  className={`flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all font-semibold touch-manipulation min-w-[44px] min-h-[44px] ${
                    mainTab === tab.id
                      ? 'bg-white text-emerald-600 shadow-lg'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="hidden md:inline text-sm">{tab.label}</span>
                </button>
              ))}

              {/* Login/Signup for guests, Logout for logged-in users */}
              {currentUser ? (
                <button
                  onClick={async () => {
                    await logout();
                    // Just logout - user continues as guest, no popup
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-all font-semibold touch-manipulation min-w-[44px] min-h-[44px]"
                  title={currentUser?.email || "Logout"}
                >
                  <LogOut className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="hidden md:inline text-sm">Logout</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthGateFromLogout(true);
                      setShowAuthGate(true);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl bg-white text-emerald-600 hover:bg-emerald-50 transition-all font-semibold touch-manipulation min-h-[44px]"
                  >
                    <span className="text-sm">Login</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthGateFromLogout(true);
                      setShowAuthGate(true);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-all font-semibold touch-manipulation min-h-[44px]"
                  >
                    <span className="text-sm">Sign Up Free</span>
                  </button>
                </div>
              )}
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
                  className={`flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg transition-all text-sm font-medium touch-manipulation ${
                    view === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
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
                { id: 'shipping', icon: Truck, label: 'Shipping' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-lg transition-all text-sm font-medium touch-manipulation ${
                    view === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
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


      <div className="p-6">
        {view === 'pricing' && (
          <>
            {/* Community Home View */}
            <div className="max-w-7xl mx-auto">
              {/* Market Search Bar */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Search What's Selling</h2>
                <MarketSearch
                  defaultZipCode={userZipCode}
                  defaultRadius={searchRadius}
                  onZipChange={(zip, radius) => {
                    setUserZipCode(zip);
                    setSearchRadius(radius);
                  }}
                />
              </div>

              {/* Price My Item CTA */}
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg p-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-white text-center sm:text-left">
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">Ready to sell something?</h2>
                    <p className="text-emerald-100 text-sm sm:text-base">Get AI-powered pricing in seconds</p>
                  </div>
                  <button
                    onClick={() => setShowPricingTool(!showPricingTool)}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-emerald-600 font-bold text-lg rounded-xl hover:bg-emerald-50 transition shadow-lg"
                  >
                    {showPricingTool ? 'Hide Pricing Tool' : 'Price My Item'}
                  </button>
                </div>
              </div>

              {/* Pricing Tool (Collapsible) */}
              {showPricingTool && (
                <div className="mb-6">
                  {/* Mode Toggle */}
                  <div className="mb-4">
                    <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
                      <button
                        onClick={() => setAnalysisMode('single')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          analysisMode === 'single'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Single Item
                      </button>
                      <button
                        onClick={() => setAnalysisMode('bulk')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          analysisMode === 'bulk'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Bulk Analysis
                      </button>
                    </div>
                  </div>

                  {analysisMode === 'single' ? (
                    <PricingTool {...{itemName, setItemName, condition, setCondition, location, setLocation, additionalDetails, setAdditionalDetails, images, handleImageUpload, removeImage, loading, imageLoading, error, analyzePricing, result, showFeedback, feedbackSubmitted, submitFeedback, userProfile, resultsRef, formKey, currentListingId, handleFeedbackSubmit, showTransactionModal, setShowTransactionModal, setView, setResult, setImages, setError, setShowFeedback, setFeedbackSubmitted, setFormKey, currentUser}} />
                  ) : (
                    <BulkAnalysis />
                  )}
                </div>
              )}

              {/* Trending Items */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                <TrendingItems
                  zipCode={userZipCode}
                  onCategoryClick={(category) => {
                    // Could pre-fill search or show category details
                    console.log('Category clicked:', category);
                  }}
                />
              </div>

              {/* Community Sales */}
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <CommunitySales zipCode={userZipCode} maxItems={8} />
              </div>
            </div>
          </>
        )}
        {view === 'shipping' && <ShippingCalculator />}
        {view === 'dashboard' && <Dashboard stats={stats} userProfile={userProfile} onUpdateItem={updateFeedbackItem} />}
        {view === 'history' && <ItemHistory />}
        {view === 'achievements' && <Achievements userProfile={userProfile} />}
        {view === 'leaderboard' && <Leaderboard />}
        {view === 'feedback-dashboard' && <FeedbackDashboard />}
        {/* STRIPE TEMPORARILY DISABLED - Uncomment when ready to go live */}
        {/* {view === 'subscription' && <Subscription />} */}
      </div>

      {/* Auth Gate Modal - Shown when guest hits 2 analysis limit or after logout */}
      {showAuthGate && (
        <AuthGateModal
          onClose={() => {
            setShowAuthGate(false);
            setAuthGateFromLogout(false);
          }}
          attemptsUsed={userProfile?.guestAttempts || 0}
          showGuestOption={authGateFromLogout}
        />
      )}
    </div>
  );
}

function PricingTool({itemName, setItemName, condition, setCondition, location, setLocation, additionalDetails, setAdditionalDetails, images, handleImageUpload, removeImage, loading, imageLoading, error, analyzePricing, result, showFeedback, feedbackSubmitted, submitFeedback, userProfile, resultsRef, formKey, currentListingId, handleFeedbackSubmit, setShowTransactionModal, currentUser}) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Slogan Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">Precision Prices</h1>
        <p className="text-xl text-gray-700 font-semibold mb-1">Sell smarter, buy fair, with AI-powered precision pricing</p>
        <p className="text-lg text-gray-600">Get instant fair market value recommendations to sell faster online</p>
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
                {images.length < 5 && !imageLoading && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 md:p-8 text-center hover:border-indigo-400 transition cursor-pointer active:border-indigo-500 min-h-[120px] flex items-center justify-center">
                    <input
                      key={formKey}
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={imageLoading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block w-full">
                      <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                      <p className="text-gray-600 mb-1 text-sm sm:text-base font-medium">Tap to upload images</p>
                      <p className="text-xs sm:text-sm text-gray-500">JPEG, PNG, HEIC, WebP up to 10MB each ({images.length}/5 uploaded)</p>
                    </label>
                  </div>
                )}
                {imageLoading && (
                  <div className="border-2 border-indigo-500 bg-indigo-50 rounded-lg p-4 sm:p-6 md:p-8 text-center touch-none min-h-[200px] flex flex-col justify-center">
                    <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
                    <p className="text-indigo-700 font-bold mb-2 text-base sm:text-lg">Loading image...</p>
                    <p className="text-sm sm:text-base text-indigo-600">This may take a few seconds</p>
                    <div className="mt-4 sm:mt-5 w-full max-w-xs mx-auto bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full animate-pulse" style={{width: '100%'}}></div>
                    </div>
                  </div>
                )}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img.preview} alt={`Preview ${idx + 1}`} className="w-full h-32 sm:h-48 md:h-56 lg:h-64 object-cover rounded-lg" />
                        <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 active:bg-red-700 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (with ZIP for best accuracy)</label>
                  <input type="text" value={location} onChange={(e) => {
                    let value = InputValidation.sanitizeText(e.target.value, 100);
                    // Additional path traversal protection
                    value = value.replace(/\.\./g, '').replace(/[\/\\]/g, '');
                    setLocation(value);
                  }} placeholder="e.g., New York, NY 10001" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  <div className="text-xs text-gray-500 mt-1">
                    Including ZIP code helps us give you precise local pricing • {location.length}/100 characters
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

              <button onClick={analyzePricing} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 touch-manipulation min-h-[48px]">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing...</> : <><Search className="w-5 h-5" />Analyze Pricing</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - How to Use Summary (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:sticky lg:top-6">
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
              <p className="text-sm text-gray-600 italic">Our AI analyzes local listings to help you price smarter.</p>
            </div>
          </div>
        </div>
      </div>

      {result && <ResultsDisplay
        result={result}
        showFeedback={showFeedback}
        feedbackSubmitted={feedbackSubmitted}
        submitFeedback={submitFeedback}
        resultsRef={resultsRef}
        onNewAnalysis={() => {
          window.location.reload();
        }}
        currentListingId={currentListingId}
        handleFeedbackSubmit={handleFeedbackSubmit}
        userProfile={userProfile}
        images={images}
        itemDetails={{
          itemName,
          condition,
          location,
          additionalDetails
        }}
        currentUser={currentUser}
      />}
    </div>
  );
}

function ResultsDisplay({result, showFeedback, feedbackSubmitted, submitFeedback, resultsRef, onNewAnalysis, currentListingId, handleFeedbackSubmit, userProfile, images, itemDetails, currentUser}) {
  const [showShare, setShowShare] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

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
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={onNewAnalysis} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-lg touch-manipulation">
              <Search className="w-4 h-4" />New Analysis
            </button>
            <button
              type="button"
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white rounded-lg touch-manipulation"
            >
              <CheckCircle className="w-4 h-4" />
              Report Sale
            </button>
            <button type="button" onClick={shareSuccess} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg touch-manipulation">
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
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-green-600" />
          <h2 className="text-2xl font-bold">Pricing Recommendation</h2>
        </div>

        {/* Bullseye Price Target Visualization */}
        <BullseyePriceTarget
          min={result.suggestedPriceRange.min}
          max={result.suggestedPriceRange.max}
          optimal={result.suggestedPriceRange.optimal}
          confidence={result.confidenceScore || 70}
          locationData={result.locationData}
          dataCount={result.dataCount || 0}
        />

        {/* Real Market Data Insights */}
        {result.pricingInsights && (
          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-emerald-900">Market Data Insights</h3>
            </div>
            <p className="text-sm text-emerald-800">{result.pricingInsights}</p>
          </div>
        )}

        {/* Pricing Strategy Details */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Listing Strategy
          </h3>
          <div className="space-y-2">
            <p className="text-blue-800"><strong>Suggested List Price:</strong> ${result.pricingStrategy.listingPrice}</p>
            <p className="text-blue-800"><strong>Don't Go Below:</strong> ${result.pricingStrategy.minimumAcceptable}</p>
            <p className="text-sm text-blue-700 mt-3 p-3 bg-white bg-opacity-50 rounded">{result.pricingStrategy.reasoning}</p>
          </div>
        </div>
      </div>

      {/* Facebook Marketplace Integration */}
      <FacebookMarketplaceButton
        analysisResult={result}
        images={images}
        itemDetails={itemDetails}
        userId={currentUser?.uid || 'guest'}
      />

      {showFeedback && !feedbackSubmitted && <FeedbackForm onSubmit={submitFeedback} />}

      {/* MicroFeedback Component */}
      {showFeedback && !feedbackSubmitted && currentListingId && (
        <div className="mt-4">
          <MicroFeedback
            listingId={currentListingId}
            onFeedbackSubmit={async (feedbackData) => {
              await handleFeedbackSubmit(feedbackData, userProfile);
            }}
          />
        </div>
      )}

      {feedbackSubmitted && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 text-green-600 justify-center">
            <CheckCircle className="w-8 h-8" />
            <p className="text-xl font-semibold">Feedback submitted! Thank you!</p>
          </div>
        </div>
      )}

      {/* TransactionOutcome Modal */}
      {showTransactionModal && currentListingId && (
        <TransactionOutcome
          listingId={currentListingId}
          suggestedPrice={result.suggestedPriceRange.optimal}
          onSubmit={async (outcomeData) => {
            const submitResult = await handleFeedbackSubmit(outcomeData, userProfile);
            if (submitResult.success) {
              setShowTransactionModal(false);
            }
          }}
          onClose={() => setShowTransactionModal(false)}
        />
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
                className={`flex-1 px-4 py-3 min-h-[44px] rounded text-sm font-medium transition touch-manipulation ${
                  editData.wasSold
                    ? 'bg-green-500 text-white active:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                }`}
              >
                Sold
              </button>
              <button
                onClick={() => setEditData({ ...editData, wasSold: false })}
                className={`flex-1 px-4 py-3 min-h-[44px] rounded text-sm font-medium transition touch-manipulation ${
                  !editData.wasSold
                    ? 'bg-orange-500 text-white active:bg-orange-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
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
                className={`flex-1 px-4 py-3 min-h-[44px] rounded text-sm font-medium transition flex items-center justify-center gap-1 touch-manipulation ${
                  editData.wasFair
                    ? 'bg-green-500 text-white active:bg-green-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> Yes
              </button>
              <button
                onClick={() => setEditData({ ...editData, wasFair: false })}
                className={`flex-1 px-4 py-3 min-h-[44px] rounded text-sm font-medium transition flex items-center justify-center gap-1 touch-manipulation ${
                  editData.wasFair === false
                    ? 'bg-red-500 text-white active:bg-red-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
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
      price: '$1.99',
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
      price: '$5.99',
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
      price: '$14.99',
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
      const apiUrl = import.meta.env.VITE_BACKEND_URL
        ? `${import.meta.env.VITE_BACKEND_URL}/api/create-checkout-session`
        : import.meta.env.DEV
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
  const { getItemHistory, updateUserProfile, currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingListing, setCreatingListing] = useState(null); // Track which item is being created
  const [copiedId, setCopiedId] = useState(null);

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

  const createListingForItem = async (item, index) => {
    setCreatingListing(index);
    try {
      const { saveListing } = await import('./listingStorage');

      // Prepare listing data from history item
      const listingData = {
        itemIdentification: {
          name: item.itemName,
          category: item.category,
          brand: item.brand,
          observedCondition: item.condition
        },
        pricingStrategy: {
          listingPrice: item.suggestedPrice
        },
        suggestedPriceRange: item.priceRange,
        marketInsights: item.marketInsights,
        location: item.location,
        condition: item.condition,
      };

      const listingId = await saveListing(listingData, currentUser?.uid || 'guest');
      const listingUrl = `${window.location.origin}/item/${listingId}`;

      // Update the item in history with the listing URL
      const updatedHistory = [...history];
      updatedHistory[index] = { ...item, listingUrl, listingId };
      setHistory(updatedHistory);

    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setCreatingListing(null);
    }
  };

  const copyListingUrl = async (url, itemId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(itemId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

            {/* Listing URL Section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {item.listingUrl ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Link className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium">Shareable Listing:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="text"
                      readOnly
                      value={item.listingUrl}
                      className="flex-1 min-w-0 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
                    />
                    <button
                      onClick={() => copyListingUrl(item.listingUrl, item.id || index)}
                      className="flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition text-sm font-medium"
                    >
                      {copiedId === (item.id || index) ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                    <a
                      href={item.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => createListingForItem(item, index)}
                  disabled={creatingListing === index}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingListing === index ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Create Shareable Listing
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Achievements({userProfile}) {
  // Group badges by level
  const badgesByLevel = {
    1: Object.keys(BADGES).filter(id => BADGES[id].level === 1),
    2: Object.keys(BADGES).filter(id => BADGES[id].level === 2),
    3: Object.keys(BADGES).filter(id => BADGES[id].level === 3),
    4: Object.keys(BADGES).filter(id => BADGES[id].level === 4),
    5: Object.keys(BADGES).filter(id => BADGES[id].level === 5)
  };

  const totalBadges = Object.keys(BADGES).length;
  const unlockedCount = userProfile?.badges?.length || 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Achievements</h2>
              <p className="text-gray-600 mt-1">Progress through 5 levels of mastery</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-indigo-600">Level {userProfile?.level || 1}</div>
              <p className="text-sm text-gray-600">{unlockedCount}/{totalBadges} badges</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-500"
                 style={{width: `${(unlockedCount / totalBadges) * 100}%`}}></div>
          </div>
        </div>

        {[1, 2, 3, 4, 5].map(level => (
          <div key={level} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`px-4 py-2 rounded-lg font-bold ${level <= (userProfile?.level || 1) ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                Level {level}
              </div>
              <h3 className="text-xl font-semibold text-gray-700">
                {level === 1 && "Onboarding & Early Wins"}
                {level === 2 && "Engagement & Habit Formation"}
                {level === 3 && "Skill & Performance"}
                {level === 4 && "Monetization & Mastery"}
                {level === 5 && "Authority & Power User"}
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {badgesByLevel[level].map(badgeId => {
                const badge = BADGES[badgeId];
                const unlocked = userProfile?.badges?.includes(badgeId);

                return (
                  <div key={badgeId}
                       className={`p-4 rounded-xl border-2 text-center transition-all ${
                         unlocked
                           ? 'bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 border-yellow-400 shadow-md'
                           : 'bg-gray-50 border-gray-200 opacity-60 grayscale'
                       }`}>
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="font-bold text-sm text-gray-900 mb-1">{badge.name}</p>
                    <p className="text-xs text-gray-600 mb-2">{badge.desc}</p>
                    {unlocked && (
                      <div className="flex justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {!unlocked && (
                      <div className="text-xs text-gray-400 mt-1">🔒 Locked</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackForm({onSubmit}) {
  const [wasFair, setWasFair] = useState(null);
  const [wasSold, setWasSold] = useState(null);
  const [actualPrice, setActualPrice] = useState('');
  const [daysToSell, setDaysToSell] = useState('');
  const [feedback, setFeedback] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Help Us Improve</h2>
        <div className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
          🎁 Earn rewards for feedback!
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <p className="font-medium mb-3">Was this pricing recommendation helpful and accurate?</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => setWasFair(true)} className={`flex-1 py-3 px-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${wasFair === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-green-300'}`}>
              <ThumbsUp className="w-5 h-5" />Yes, Helpful
            </button>
            <button type="button" onClick={() => setWasFair(false)} className={`flex-1 py-3 px-4 rounded-lg border-2 transition flex items-center justify-center gap-2 ${wasFair === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 hover:border-red-300'}`}>
              <ThumbsDown className="w-5 h-5" />Not Helpful
            </button>
          </div>
        </div>

        <div>
          <p className="font-medium mb-3">Did you sell it?</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => setWasSold(true)} className={`flex-1 py-3 rounded-lg border-2 transition ${wasSold === true ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-green-300'}`}>Yes, Sold!</button>
            <button type="button" onClick={() => setWasSold(false)} className={`flex-1 py-3 rounded-lg border-2 transition ${wasSold === false ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 hover:border-orange-300'}`}>Not Yet</button>
          </div>
        </div>

        {wasSold && (
          <>
            <div>
              <label className="block font-medium mb-2">Actual sale price? *</label>
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
              }} placeholder="Enter price" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block font-medium mb-2">How many days did it take to sell? (optional)</label>
              <input
                type="number"
                value={daysToSell}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 365)) {
                    setDaysToSell(value);
                  }
                }}
                placeholder="e.g., 5"
                min="0"
                max="365"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">This helps us understand market timing</p>
            </div>
          </>
        )}

        <div>
          <label className="block font-medium mb-2">Comments (optional)</label>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Any feedback about the pricing or your experience..." rows={3} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>

        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Validate required fields
            if (wasFair === null || wasSold === null) {
              alert('Please answer both questions before submitting.');
              return;
            }

            // If sold, require actual price
            if (wasSold && !actualPrice) {
              alert('Please enter the actual sale price.');
              return;
            }

            let priceValue = null;
            if (actualPrice) {
              const validation = InputValidation.validatePrice(actualPrice);
              if (!validation.valid) {
                alert(validation.error);
                return;
              }
              priceValue = validation.value;
            }

            const daysValue = daysToSell ? parseInt(daysToSell) : null;

            try {
              await onSubmit(wasFair, wasSold, priceValue, feedback, daysValue);
            } catch (error) {
              alert('There was an error submitting your feedback. Please try again.');
            }
          }}
          disabled={wasFair === null || wasSold === null || (wasSold && !actualPrice)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition cursor-pointer"
        >
          Submit Feedback
        </button>

        <div className="text-xs text-center text-gray-500 bg-gray-50 p-3 rounded-lg">
          💚 Your feedback helps improve pricing for everyone! Thank you for contributing to our community database.
        </div>
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
  const [activeTab, setActiveTab] = useState('week');
  const [activeCategory, setActiveCategory] = useState('value');
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, activeCategory]);

  const generateRealisticLeaders = (timeframe) => {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sam', 'Jamie'];
    const lastInitials = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');

    const timeMultiplier = timeframe === 'week' ? 0.2 : timeframe === 'month' ? 0.7 : 1;
    const count = 10;

    return Array.from({ length: count }, (_, i) => {
      const baseSales = Math.floor((50 - i * 3) * timeMultiplier) + Math.floor(Math.random() * 5);
      const baseEarnings = Math.floor(baseSales * (25 + Math.random() * 60));

      return {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastInitials[Math.floor(Math.random() * lastInitials.length)]}.`,
        sales: Math.max(1, baseSales),
        earnings: Math.max(50, baseEarnings),
        accuracy: Math.floor(70 + Math.random() * 28),
        quickSales: Math.floor(baseSales * 0.3),
        streak: Math.floor(Math.random() * (timeframe === 'week' ? 7 : timeframe === 'month' ? 20 : 50)) + 1,
        movement: Math.floor(Math.random() * 5) - 2
      };
    });
  };

  const loadLeaderboard = async () => {
    try {
      // Load user profile to include in rankings
      const userStored = await window.storage.get('userprofile');
      const userProfile = userStored?.value ? JSON.parse(userStored.value) : null;

      // Check for custom stored leaderboard data
      const stored = await window.storage.get('leaderboard', true);

      let leaderData;
      if (stored && stored.value) {
        // Use stored data if available (backward compatible)
        leaderData = JSON.parse(stored.value);
      } else {
        // Generate realistic data based on timeframe
        leaderData = generateRealisticLeaders(activeTab);
      }

      setLeaders(leaderData);

      // Calculate user's rank if they have activity
      if (userProfile && (userProfile.itemsSold > 0 || userProfile.totalEarnings > 0)) {
        const userScore = activeCategory === 'value' ? (userProfile.totalEarnings || 0)
                        : activeCategory === 'accuracy' ? (userProfile.accurateCount || 0)
                        : activeCategory === 'speed' ? (userProfile.quickSales || 0)
                        : (userProfile.itemsSold || 0);

        const usersAbove = leaderData.filter(l => {
          const leaderScore = activeCategory === 'value' ? l.earnings
                            : activeCategory === 'accuracy' ? (l.accuracy || 0)
                            : activeCategory === 'speed' ? (l.quickSales || 0)
                            : l.sales;
          return leaderScore > userScore;
        }).length;

        setUserRank({
          rank: usersAbove + 1,
          score: userScore,
          movement: Math.floor(Math.random() * 3) - 1
        });
      } else {
        setUserRank(null);
      }
    } catch (e) {
      console.error('Error loading leaderboard:', e);
      setLeaders(generateRealisticLeaders(activeTab));
    }
  };

  const getCategoryInfo = () => {
    switch (activeCategory) {
      case 'value': return { icon: '💰', name: 'Top Value Creators', metric: 'earnings', suffix: 'earned' };
      case 'accuracy': return { icon: '🎯', name: 'Most Accurate', metric: 'accuracy', suffix: 'accurate' };
      case 'speed': return { icon: '⚡', name: 'Fastest Sellers', metric: 'quickSales', suffix: 'quick sales' };
      case 'volume': return { icon: '📦', name: 'Volume Leaders', metric: 'sales', suffix: 'sold' };
      default: return { icon: '🏆', name: 'Leaderboard', metric: 'earnings', suffix: 'earned' };
    }
  };

  const category = getCategoryInfo();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-xl p-6 sm:p-8 text-white mb-6">
        <div className="flex items-center gap-4">
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Leaderboard</h2>
            <p className="text-sm sm:text-lg opacity-90">Compete with the best sellers</p>
          </div>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2 mb-4">
        <div className="flex gap-2">
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'alltime', label: 'All-Time' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'value', icon: '💰', label: 'Value' },
            { id: 'accuracy', icon: '🎯', label: 'Accuracy' },
            { id: 'speed', icon: '⚡', label: 'Speed' },
            { id: 'volume', icon: '📦', label: 'Volume' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3 rounded-lg text-center transition ${
                activeCategory === cat.id
                  ? 'bg-indigo-50 border-2 border-indigo-500'
                  : 'bg-gray-50 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className={`text-xs font-semibold ${activeCategory === cat.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                {cat.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* User Rank Card */}
      {userRank && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Your Rank</div>
              <div className="text-3xl font-bold">
                #{userRank.rank}
                {userRank.movement !== 0 && (
                  <span className="text-lg ml-2">
                    {userRank.movement > 0 ? `↑${userRank.movement}` : userRank.movement < 0 ? `↓${Math.abs(userRank.movement)}` : ''}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {activeCategory === 'accuracy' ? `${userRank.score}%` : activeCategory === 'value' ? `$${userRank.score}` : userRank.score}
              </div>
              <div className="text-xs opacity-90">{category.suffix}</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </h3>

        <div className="space-y-3">
          {leaders.map((leader, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                idx === 0
                  ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400'
                  : idx === 1
                  ? 'bg-gray-100 border-2 border-gray-400'
                  : idx === 2
                  ? 'bg-orange-50 border-2 border-orange-300'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                <div className="text-2xl sm:text-3xl font-bold w-10 sm:w-12 text-center flex-shrink-0">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base sm:text-lg truncate">{leader.name}</p>
                    {leader.movement && leader.movement !== 0 && (
                      <span className={`text-sm font-semibold ${leader.movement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {leader.movement > 0 ? `↑${leader.movement}` : `↓${Math.abs(leader.movement)}`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                    <span>📦 {leader.sales} sold</span>
                    {leader.streak > 0 && <span>🔥 {leader.streak}-day</span>}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {activeCategory === 'value' && (
                  <>
                    <p className="text-lg sm:text-2xl font-bold text-green-600">${leader.earnings}</p>
                    <p className="text-xs text-gray-600">earned</p>
                  </>
                )}
                {activeCategory === 'accuracy' && (
                  <>
                    <p className="text-lg sm:text-2xl font-bold text-indigo-600">{leader.accuracy}%</p>
                    <p className="text-xs text-gray-600">accurate</p>
                  </>
                )}
                {activeCategory === 'speed' && (
                  <>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{leader.quickSales}</p>
                    <p className="text-xs text-gray-600">quick</p>
                  </>
                )}
                {activeCategory === 'volume' && (
                  <>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600">{leader.sales}</p>
                    <p className="text-xs text-gray-600">sold</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {!userRank && (
          <div className="mt-6 p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200 text-center">
            <p className="text-indigo-900 font-semibold">
              🎯 Start selling to join the leaderboard!
            </p>
          </div>
        )}
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

function BulkAnalysis() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      itemName: '',
      condition: 'good',
      location: '',
      images: [],
      result: null,
      loading: false,
      imageLoading: false,
      error: null
    }]);
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleImageUpload = async (id, e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const validation = InputValidation.validateImageFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      updateItem(id, 'error', errors.join('; '));
    }

    const newImages = validFiles.slice(0, 5);

    // Check if any files need HEIC conversion
    const hasHEIC = newImages.some(file =>
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif')
    );

    if (hasHEIC) {
      updateItem(id, 'imageLoading', true);
    }

    // Process images: Convert HEIC to JPEG for API compatibility (Anthropic only supports jpeg/png/gif/webp)
    const processPromises = newImages.map(async (file) => {
      try {
        const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' ||
                       file.name.toLowerCase().endsWith('.heic') ||
                       file.name.toLowerCase().endsWith('.heif');

        let uploadFile = file;

        if (isHEIC) {
          // Convert HEIC to JPEG (required by Anthropic API)
          try {
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.6  // Lower quality to reduce file size
            });

            let blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            // Compress further if still > 2MB
            if (blob.size > 2 * 1024 * 1024) {
              blob = await compressImageBlob(blob, 0.7, 1920);
            }

            uploadFile = new File(
              [blob],
              file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
              { type: 'image/jpeg' }
            );
          } catch (conversionError) {
            throw new Error(`${file.name}: HEIC conversion failed. Please try a different photo format.`);
          }
        } else if (file.size > 2 * 1024 * 1024) {
          // Compress large non-HEIC images
          try {
            const compressed = await compressImageBlob(file, 0.7, 1920);
            uploadFile = new File([compressed], file.name, { type: file.type });
          } catch (compressError) {
            // Compression failed, use original file
          }
        }

        // Read file to dataURL for both preview and upload
        const dataURL = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });

        return { file: uploadFile, preview: dataURL };
      } catch (err) {
        throw new Error(`${file.name}: ${err.message || 'Processing failed'}`);
      }
    });

    try {
      const processedImages = await Promise.all(processPromises);
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, images: [...item.images, ...processedImages], imageLoading: false } : item
      ));
    } catch (err) {
      updateItem(id, 'error', err.message);
      updateItem(id, 'imageLoading', false);
    }
  };

  const removeImage = (itemId, imageIndex) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, images: item.images.filter((_, i) => i !== imageIndex) } : item
    ));
  };

  const analyzeAll = async () => {
    setLoading(true);
    setCompletedCount(0);

    const apiUrl = import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/api/analyze`
      : import.meta.env.DEV
      ? `http://${window.location.hostname}:3001/api/analyze`
      : '/api/analyze';

    for (const item of items) {
      if (!item.itemName.trim()) {
        updateItem(item.id, 'error', 'Item name required');
        continue;
      }

      updateItem(item.id, 'loading', true);

      try {
        // Convert images to base64 (same as regular analysis)
        const contentParts = [];

        for (const img of item.images) {
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

          // Detect actual image type from base64 magic bytes (more reliable than file.type on iOS)
          // Anthropic API only supports: image/jpeg, image/png, image/gif, image/webp
          const detectImageType = (base64) => {
            const header = atob(base64.substring(0, 16));
            const bytes = new Uint8Array([...header].map(c => c.charCodeAt(0)));
            if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
            if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
            if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
            if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
            return 'image/jpeg';
          };

          const mediaType = detectImageType(base64Data);

          contentParts.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data }
          });
        }

        // Build prompt (simplified version)
        const currentDate = new Date();
        const season = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'][currentDate.getMonth()];

        let prompt = `You are a marketplace pricing expert. Analyze this item for accurate pricing.`;
        if (item.images.length > 0) prompt += `\n\nAnalyze the ${item.images.length} image(s).`;

        prompt += `\n\nItem: ${item.itemName}\nCondition: ${item.condition}\nLocation: ${item.location || 'Not specified'}`;
        prompt += `\n\nProvide ONLY valid JSON in this structure:\n{\n  "itemIdentification": {"name": "string", "category": "string"},\n  "suggestedPriceRange": {"min": number, "max": number, "optimal": number},\n  "pricingStrategy": {"listingPrice": number, "minimumAcceptable": number}\n}`;

        contentParts.push({ type: 'text', text: prompt });

        // Add timeout for bulk analysis (180 seconds for mobile photo uploads)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        let response;
        let retryCount = 0;
        const maxRetries = 2;

        // Retry logic with exponential backoff
        while (retryCount <= maxRetries) {
          try {
            response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [{ role: 'user', content: contentParts }]
              }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            break; // Success, exit retry loop
          } catch (fetchErr) {
            retryCount++;
            if (fetchErr.name === 'AbortError' || retryCount > maxRetries) {
              throw fetchErr;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        try {

          if (!response.ok) {
            const errorData = await response.json();
            if (errorData.error?.type === 'prohibited_content') {
              throw new Error(errorData.error.message);
            }
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
          }

          const data = await response.json();

          // Parse Claude's response
          const textContent = data.content.find(c => c.type === 'text')?.text || '';
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const parsedResult = JSON.parse(jsonMatch[0]);
            // Format result to match expected structure
            const formattedResult = {
              pricing: {
                prices: [
                  parsedResult.suggestedPriceRange?.min || 0,
                  parsedResult.pricingStrategy?.listingPrice || parsedResult.suggestedPriceRange?.optimal || 0,
                  parsedResult.suggestedPriceRange?.max || 0
                ]
              }
            };
            updateItem(item.id, 'result', formattedResult);
            updateItem(item.id, 'error', null);
          } else {
            throw new Error('Unable to parse pricing data');
          }

          setCompletedCount(prev => prev + 1);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timed out after 3 minutes. Please check your internet connection and try again. If the issue persists, try with fewer photos.');
          }
          throw fetchError;
        }
      } catch (err) {
        updateItem(item.id, 'error', err.message);
      } finally {
        updateItem(item.id, 'loading', false);
      }
    }

    setLoading(false);
  };

  const exportResults = () => {
    const csv = [
      ['Item Name', 'Condition', 'Location', 'Low Price', 'Target Price', 'High Price', 'Status'].join(','),
      ...items.map(item => {
        if (!item.result) return [item.itemName, item.condition, item.location, '', '', '', 'Not analyzed'].join(',');
        const prices = item.result.pricing?.prices || [];
        return [
          item.itemName,
          item.condition,
          item.location,
          prices[0] || '',
          prices[1] || '',
          prices[2] || '',
          'Complete'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-analysis-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Slogan Section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">Analyze Multiple Items at Once!</h1>
        <p className="text-lg text-gray-600">Perfect for vendors - get AI pricing for all your inventory</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items List (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bulk Analysis</h2>
                <p className="text-gray-600">Add multiple items and analyze them all at once</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Package className="w-4 h-4" />
                  Add Item
                </button>
                {items.length > 0 && (
                  <>
                    <button
                      onClick={analyzeAll}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Analyze All ({items.length})
                    </button>
                    <button
                      onClick={exportResults}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">Analyzing items...</p>
                <p className="text-sm text-blue-700">Completed: {completedCount} / {items.length}</p>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No items yet</p>
            <p className="text-gray-500 mb-6">Click "Add Item" to start analyzing multiple items</p>
            <button
              onClick={addItem}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Item #{index + 1}</h3>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Upload Photos First */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos (up to 5)</label>
                    {!item.imageLoading && (
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        onChange={(e) => handleImageUpload(item.id, e)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    )}
                    {item.imageLoading && (
                      <div className="border-2 border-indigo-400 bg-indigo-50 rounded-lg p-4 text-center touch-none">
                        <Loader2 className="w-8 h-8 text-indigo-500 mx-auto mb-2 animate-spin" />
                        <p className="text-indigo-700 text-xs sm:text-sm font-medium">Image loading, may take a few seconds</p>
                      </div>
                    )}
                    {item.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {item.images.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img src={img.preview} alt={`Preview ${idx + 1}`} className="w-full h-64 object-cover rounded-lg" />
                            <button
                              onClick={() => removeImage(item.id, idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Item Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name {item.images.length === 0 && '*'}
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., iPhone 13 Pro"
                    />
                  </div>

                  {/* Condition + Location Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateItem(item.id, 'condition', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location (with ZIP for best accuracy)</label>
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="ZIP code or city"
                      />
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                    <textarea
                      value={item.additionalDetails || ''}
                      onChange={(e) => updateItem(item.id, 'additionalDetails', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Brand, model, defects, accessories included, etc."
                    />
                  </div>
                </div>

                {item.error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">{item.error}</p>
                  </div>
                )}

                {item.loading && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <p className="text-blue-800 text-sm">Analyzing...</p>
                  </div>
                )}

                {item.result && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-green-900">Analysis Complete</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-600">Low</p>
                          <p className="text-lg font-bold text-gray-900">${item.result.pricing?.prices[0] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Target</p>
                          <p className="text-lg font-bold text-emerald-600">${item.result.pricing?.prices[1] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">High</p>
                          <p className="text-lg font-bold text-gray-900">${item.result.pricing?.prices[2] || 0}</p>
                        </div>
                      </div>
                    </div>

                    {/* Listing Strategy */}
                    {item.result.pricingStrategy && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Listing Strategy
                        </h3>
                        <div className="space-y-2">
                          <p className="text-blue-800 text-sm"><strong>Suggested List Price:</strong> ${item.result.pricingStrategy.listingPrice}</p>
                          <p className="text-blue-800 text-sm"><strong>Don't Go Below:</strong> ${item.result.pricingStrategy.minimumAcceptable}</p>
                          <p className="text-xs text-blue-700 mt-2 p-2 bg-white bg-opacity-50 rounded">{item.result.pricingStrategy.reasoning}</p>
                        </div>
                      </div>
                    )}

                    {/* Help Us Improve Button */}
                    {!item.feedbackShown && (
                      <button
                        onClick={() => updateItem(item.id, 'feedbackShown', true)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-medium flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Help Us Improve
                      </button>
                    )}

                    {/* Feedback Form */}
                    {item.feedbackShown && !item.feedbackSubmitted && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Help Us Improve</h3>
                          <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                            🎁 Earn rewards!
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Did you sell this item?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateItem(item.id, 'wasSold', true)}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                  item.wasSold === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => updateItem(item.id, 'wasSold', false)}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                  item.wasSold === false
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          {item.wasSold && (
                            <div>
                              <label className="block text-sm font-medium mb-1">Actual Sale Price</label>
                              <input
                                type="number"
                                value={item.actualPrice || ''}
                                onChange={(e) => updateItem(item.id, 'actualPrice', e.target.value)}
                                placeholder="Enter sale price"
                                className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium mb-2">Was the pricing accurate?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateItem(item.id, 'wasFair', true)}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-1 ${
                                  item.wasFair === true
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" /> Yes
                              </button>
                              <button
                                onClick={() => updateItem(item.id, 'wasFair', false)}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-1 ${
                                  item.wasFair === false
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" /> No
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => updateItem(item.id, 'feedbackSubmitted', true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium text-sm"
                          >
                            Submit Feedback
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feedback Submitted Confirmation */}
                    {item.feedbackSubmitted && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <p className="text-sm font-medium">Feedback submitted! Thank you!</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </div>
        </div>

        {/* Right Column - How to Use Summary (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:sticky lg:top-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How Bulk Analysis Works</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Add Items</h4>
                  <p className="text-sm text-gray-600">Click "Add Item" to create entries for all products you want to price</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Fill Details</h4>
                  <p className="text-sm text-gray-600">For each item, add photos, name, condition, and location</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Analyze All</h4>
                  <p className="text-sm text-gray-600">Click "Analyze All" to get AI pricing for every item simultaneously</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Export Results</h4>
                  <p className="text-sm text-gray-600">Download your pricing data as CSV for easy listing</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-indigo-200">
              <p className="text-sm text-gray-600 italic">Perfect for vendors with multiple items to list!</p>
            </div>
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-800 font-medium">💡 Pro Tip for Vendors:</p>
              <p className="text-xs text-green-700 mt-1">Export your results as CSV and use it to quickly create listings on multiple marketplaces!</p>
            </div>
          </div>
        </div>
      </div>
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
            <p className="text-lg">Calculate costs, find boxes, and plan public meetups</p>
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
          Public Meetup
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
          <h3 className="text-2xl font-bold mb-6">Public Meetup Location Finder</h3>
          
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
                <h4 className="text-xl font-bold text-green-900 mb-4">📍 Recommended Public Meetup Locations</h4>
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