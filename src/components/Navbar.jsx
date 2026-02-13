// src/components/Navbar.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const products = [
    { name: 'AI Price Assessments', path: '/app' },
    { name: 'Shipping Calculator', path: '/app' },
    { name: 'Bulk Analysis & Reports', path: '/app' },
    { name: 'Embeddable Widget', path: '/app' }
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProductsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProductsOpen(true);
  };

  // Handle mouse leave with delay to allow clicking
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setProductsOpen(false);
    }, 150);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-white p-1.5 rounded-xl shadow-lg flex-shrink-0 group-hover:shadow-emerald-500/30 transition-all">
              <img src="/logo.png" alt="Precision Prices Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-white">PrecisionPrices</div>
              <div className="text-xs text-slate-400">Pricing Intelligence</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Products Dropdown - Fixed with click support */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors"
                onClick={() => setProductsOpen(!productsOpen)}
              >
                <span className="font-medium">Products</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu - Simplified without icons/descriptions */}
              {productsOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {products.map((product) => (
                    <Link
                      key={product.path}
                      to={product.path}
                      className="block px-6 py-3 text-white font-medium hover:bg-slate-700/50 hover:text-emerald-400 transition-colors border-b border-slate-700/50 last:border-0"
                      onClick={() => setProductsOpen(false)}
                    >
                      {product.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <Link
              to="/app"
              className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors"
            >
              Login
            </Link>

            <Link
              to="/app"
              className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all transform hover:scale-105"
            >
              Sign Up Free
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-800 pt-4">
            <div className="space-y-4">
              <div className="text-slate-400 text-sm font-semibold mb-2">Products</div>
              {products.map((product) => (
                <Link
                  key={product.path}
                  to={product.path}
                  className="block px-4 py-3 bg-slate-800 rounded-lg text-white font-medium hover:bg-slate-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {product.name}
                </Link>
              ))}

              <div className="flex gap-2 pt-2">
                <Link
                  to="/app"
                  className="flex-1 px-4 py-3 bg-slate-800 rounded-lg text-white font-medium text-center hover:bg-slate-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>

                <Link
                  to="/app"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
