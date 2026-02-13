// src/pages/WidgetPage.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Camera, Loader2, X, Upload, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const MAX_ANALYSES = 5;
const SESSION_KEY = 'pp_widget_count';

const getUsageCount = () => {
  try {
    return parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
  } catch {
    return 0;
  }
};

const incrementUsage = () => {
  try {
    const count = getUsageCount() + 1;
    sessionStorage.setItem(SESSION_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
};

const WidgetPage = () => {
  const { businessId } = useParams();
  const [itemName, setItemName] = useState('');
  const [condition, setCondition] = useState('good');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [limitReached, setLimitReached] = useState(getUsageCount() >= MAX_ANALYSES);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.type.startsWith('image/')).slice(0, 3);

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages].slice(0, 3));
  }, []);

  const removeImage = (index) => {
    setImages(prev => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (getUsageCount() >= MAX_ANALYSES) {
      setLimitReached(true);
      return;
    }

    if (!itemName.trim()) {
      setError('Please enter an item name');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convert images to base64
      const contentParts = [];
      for (const img of images) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });

        const detectType = (b64) => {
          const header = atob(b64.substring(0, 16));
          const bytes = new Uint8Array([...header].map(c => c.charCodeAt(0)));
          if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
          if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
          if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
          return 'image/jpeg';
        };

        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: detectType(base64), data: base64 }
        });
      }

      const apiUrl = import.meta.env.VITE_BACKEND_URL
        ? `${import.meta.env.VITE_BACKEND_URL}/api/widget/analyze`
        : import.meta.env.DEV
        ? `http://${window.location.hostname}:3001/api/widget/analyze`
        : '/api/widget/analyze';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          itemName: itemName.trim(),
          condition,
          location: location.trim(),
          email: email.trim(),
          images: contentParts
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Request failed (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
      incrementUsage();

      if (getUsageCount() >= MAX_ANALYSES) {
        setLimitReached(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setItemName('');
    setCondition('good');
    setLocation('');
    setEmail('');
    setImages([]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Get an Instant Estimate</h1>
          <p className="text-gray-500 mt-1">Upload a photo and get AI-powered pricing</p>
        </div>

        {limitReached && !result ? (
          /* Rate Limit Message */
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Estimates Used</h3>
            <p className="text-gray-600 mb-4">
              You've used all {MAX_ANALYSES} free estimates for this session.
            </p>
            <a
              href="https://precisionprices.com/app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Sign Up for Unlimited Access
            </a>
          </div>
        ) : result ? (
          /* Results */
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{result.itemName || itemName}</h3>
              <p className="text-sm text-gray-500 capitalize mb-4">
                Condition: {condition}{location && ` · ${location}`}
              </p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Low</p>
                  <p className="text-lg font-bold text-gray-700">${result.prices?.min?.toLocaleString() || '—'}</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-600 mb-1">Recommended</p>
                  <p className="text-xl font-bold text-emerald-700">${result.prices?.target?.toLocaleString() || '—'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">High</p>
                  <p className="text-lg font-bold text-gray-700">${result.prices?.max?.toLocaleString() || '—'}</p>
                </div>
              </div>

              {result.insights && (
                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{result.insights}</p>
              )}
            </div>

            <button
              onClick={resetForm}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Estimate Another Item
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos (up to 3)</label>
              <div className="flex gap-3 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition">
                    <Camera className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Add</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple />
                  </label>
                )}
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Mid-Century Dresser, iPhone 15, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="ZIP code or city"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Get a copy of your estimate"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  Get Free Estimate
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              {MAX_ANALYSES - getUsageCount()} free estimate{MAX_ANALYSES - getUsageCount() !== 1 ? 's' : ''} remaining
            </p>
          </form>
        )}

        {/* Powered By */}
        <div className="mt-8 text-center">
          <a
            href="https://precisionprices.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition"
          >
            Powered by <span className="font-semibold">Precision Prices</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default WidgetPage;
