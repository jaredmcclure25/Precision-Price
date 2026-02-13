// src/components/Footer.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img src="/logo.png" alt="Precision Prices Logo" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold text-white">PrecisionPrices</span>
            </Link>
            <p className="text-slate-400 text-sm mb-4">
              AI-powered pricing tools for resellers, businesses, and professionals.
            </p>
            {/* Facebook only */}
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61586738251397" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2">
              <li><Link to="/app" className="text-slate-400 hover:text-white transition-colors text-sm">AI Price Assessments</Link></li>
              <li><Link to="/app" className="text-slate-400 hover:text-white transition-colors text-sm">Shipping Calculator</Link></li>
              <li><Link to="/app" className="text-slate-400 hover:text-white transition-colors text-sm">Bulk Analysis & Reports</Link></li>
              <li><Link to="/app" className="text-slate-400 hover:text-white transition-colors text-sm">Embeddable Widget</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#about" className="text-slate-400 hover:text-white transition-colors text-sm">About Us</a></li>
              <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">How it Works</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-sm">
                <Mail className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <a href="mailto:business@precisionprices.com" className="text-slate-400 hover:text-white transition-colors">
                  business@precisionprices.com
                </a>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <Phone className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <a href="tel:+14403198747" className="text-slate-400 hover:text-white transition-colors">
                  (440) 319-8747
                </a>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">
                  Clarksville, TN
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-slate-400 text-sm">
            © 2025 PrecisionPrices.Com. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
