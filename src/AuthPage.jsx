/**
 * Precision Prices - Authentication Page
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// Industry options for signup
const industryOptions = [
  { value: 'furniture_home', label: 'Furniture & Home Goods', icon: '🛋️', description: 'Couches, tables, decor, and household items' },
  { value: 'vintage_antiques', label: 'Vintage/Antiques/Collectibles', icon: '🏺', description: 'Antiques, collectibles, vintage items' },
  { value: 'contractor', label: 'Contractor/Construction Materials', icon: '🔨', description: 'Building materials, salvage, equipment' },
  { value: 'insurance_estate', label: 'Insurance/Estate/Liquidation', icon: '📋', description: 'Claims, estate sales, liquidation' },
  { value: 'personal', label: 'Just browsing/personal items', icon: '🛒', description: 'Personal selling, general items' }
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1); // 1: credentials, 2: industry selection
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);

    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else if (provider === 'facebook') {
        await signInWithFacebook();
      }
      // Social login successful - AuthWrapper will handle showing industry selector if needed
    } catch (err) {
      console.error('Social login error:', err);

      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up blocked. Please allow pop-ups and try again.');
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // For login, proceed directly
      handleLogin();
    } else {
      // For signup, validate and move to industry selection
      if (!displayName.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setSignupStep(2);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupComplete = async () => {
    if (!selectedIndustry) {
      setError('Please select your industry');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signup(email, password, displayName, selectedIndustry);
    } catch (err) {
      console.error('Signup error:', err);

      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
        setSignupStep(1);
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
        setSignupStep(1);
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
        setSignupStep(1);
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsLogin(true);
    setSignupStep(1);
    setEmail('');
    setPassword('');
    setDisplayName('');
    setSelectedIndustry(null);
    setError('');
  };

  // Render industry selection step
  if (!isLogin && signupStep === 2) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg">
          {/* Back button */}
          <button
            onClick={() => setSignupStep(1)}
            className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">What do you sell?</h1>
            <p className="text-slate-400">
              This helps us personalize your experience
            </p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3 mb-8">
            {industryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedIndustry(option.value)}
                disabled={loading}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedIndustry === option.value
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                }`}
              >
                <span className="text-3xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-white">{option.label}</div>
                  <div className="text-sm text-slate-400">{option.description}</div>
                </div>
                {selectedIndustry === option.value && (
                  <Check className="w-6 h-6 text-emerald-500" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSignupComplete}
            disabled={loading || !selectedIndustry}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render login/signup credentials form
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-yellow-400 bg-clip-text text-transparent">
              Precision Prices
            </h1>
          </Link>
          <p className="text-slate-400">
            {isLogin ? 'Welcome back!' : 'Create your free account'}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Continue with Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="font-medium">Continue with Facebook</span>
              </>
            )}
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-slate-400">Or use email</span>
          </div>
        </div>

        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-400"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-400"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-400"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-slate-500 mt-1">Must be at least 6 characters</p>
            )}
            {isLogin && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLogin ? 'Logging in...' : 'Continue...'}
              </>
            ) : (
              <>
                {isLogin ? 'Log In' : 'Continue'}
                {!isLogin && <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setSignupStep(1);
              setError('');
            }}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            {isLogin ? "Don't have an account? Sign up free" : 'Already have an account? Log in'}
          </button>
        </div>

        {/* Trust badges */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="flex items-center justify-center gap-6 text-slate-500 text-xs">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>No credit card</span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-slate-500 text-center">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-emerald-400 hover:text-emerald-300">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
