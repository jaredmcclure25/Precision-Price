/**
 * Precision Prices - Account Settings Component
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { useState } from 'react';
import { User, Mail, Building2, Shield, Bell, CreditCard, LogOut, Check, ChevronRight, Camera, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

// Industry display configuration
const industryConfig = {
  furniture_home: { label: 'Furniture & Home Goods', icon: '🛋️' },
  vintage_antiques: { label: 'Vintage/Antiques/Collectibles', icon: '🏺' },
  contractor: { label: 'Contractor/Construction Materials', icon: '🔨' },
  insurance_estate: { label: 'Insurance/Estate/Liquidation', icon: '📋' },
  personal: { label: 'Personal Items', icon: '🛒' }
};

// All industry options for changing
const industryOptions = [
  { value: 'furniture_home', label: 'Furniture & Home Goods', icon: '🛋️' },
  { value: 'vintage_antiques', label: 'Vintage/Antiques/Collectibles', icon: '🏺' },
  { value: 'contractor', label: 'Contractor/Construction Materials', icon: '🔨' },
  { value: 'insurance_estate', label: 'Insurance/Estate/Liquidation', icon: '📋' },
  { value: 'personal', label: 'Personal Items', icon: '🛒' }
];

export default function AccountSettings({ onClose }) {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: userProfile?.displayName || '',
    industry: userProfile?.industry || 'personal'
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({
        displayName: editForm.displayName,
        industry: editForm.industry
      });
      setSuccessMessage('Settings saved successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const currentIndustry = industryConfig[userProfile?.industry] || industryConfig.personal;

  const menuItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'preferences', icon: Building2, label: 'Preferences' },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: 'Coming Soon' },
    { id: 'billing', icon: CreditCard, label: 'Billing', badge: 'Coming Soon' },
    { id: 'security', icon: Shield, label: 'Security', badge: 'Coming Soon' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Account Settings</h1>
              <p className="text-emerald-100 mt-1">Manage your profile and preferences</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Back to App
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* User Info */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{userProfile?.displayName || 'User'}</h3>
                    <p className="text-sm text-slate-500">{currentUser?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-lg">{currentIndustry.icon}</span>
                      <span className="text-xs text-slate-400">{currentIndustry.label}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <nav className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeSection === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Profile Information</h2>
                    <p className="text-slate-500 text-sm mt-1">Update your personal details</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            displayName: userProfile?.displayName || '',
                            industry: userProfile?.industry || 'personal'
                          });
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="Your name"
                      />
                    ) : (
                      <p className="text-slate-900 py-3">{userProfile?.displayName || 'Not set'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <p className="text-slate-900 py-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {currentUser?.email}
                      <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Verified</span>
                    </p>
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Member Since</label>
                    <p className="text-slate-900 py-3">
                      {userProfile?.createdAt
                        ? new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Account Stats */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Activity</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{userProfile?.analysisCount || 0}</div>
                        <div className="text-sm text-slate-500">Items Analyzed</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{userProfile?.badges?.length || 0}</div>
                        <div className="text-sm text-slate-500">Badges Earned</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{userProfile?.streak || 0}</div>
                        <div className="text-sm text-slate-500">Day Streak</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>
                  <p className="text-slate-500 text-sm mt-1">Customize your experience</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Industry Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Industry</label>
                    <p className="text-sm text-slate-500 mb-4">This helps us personalize tool recommendations</p>

                    <div className="grid gap-3">
                      {industryOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={async () => {
                            setSaving(true);
                            await updateUserProfile({ industry: option.value });
                            setSaving(false);
                            setSuccessMessage('Industry updated!');
                            setTimeout(() => setSuccessMessage(''), 3000);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            userProfile?.industry === option.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-2xl">{option.icon}</span>
                          <span className="font-medium text-slate-900">{option.label}</span>
                          {userProfile?.industry === option.value && (
                            <Check className="w-5 h-5 text-emerald-500 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeSection === 'notifications' || activeSection === 'billing' || activeSection === 'security') && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {activeSection === 'notifications' && 'Notifications'}
                    {activeSection === 'billing' && 'Billing & Subscription'}
                    {activeSection === 'security' && 'Security'}
                  </h2>
                </div>
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeSection === 'notifications' && <Bell className="w-8 h-8 text-slate-400" />}
                    {activeSection === 'billing' && <CreditCard className="w-8 h-8 text-slate-400" />}
                    {activeSection === 'security' && <Shield className="w-8 h-8 text-slate-400" />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Coming Soon</h3>
                  <p className="text-slate-500">This feature is currently in development.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
