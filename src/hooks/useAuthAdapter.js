/**
 * Auth Hook Adapter for PrecisionPrices components
 * Wraps the existing AuthContext to provide the expected interface
 */

import { useState, useEffect } from 'react';
import { useAuth as useAuthContext } from '../AuthContext';
import { getOrCreateUserProfile, updateUserProfile as updateFirestoreProfile } from '../lib/firestore';

/**
 * Adapted useAuth hook for PrecisionPrices components
 * Provides a consistent interface with the expected naming conventions
 */
export const useAuth = () => {
  const {
    currentUser,
    userProfile: existingProfile,
    isGuestMode,
    logout,
    signInWithGoogle,
    signInWithFacebook,
    login,
    signup,
    resetPassword,
    updateUserProfile: updateContextProfile,
  } = useAuthContext();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load extended user profile for listings features
  useEffect(() => {
    const loadExtendedProfile = async () => {
      if (currentUser && !isGuestMode) {
        try {
          const profile = await getOrCreateUserProfile(currentUser.uid);
          setUserProfile({
            ...existingProfile,
            ...profile,
          });
        } catch (error) {
          console.error('Error loading extended profile:', error);
          setUserProfile(existingProfile);
        }
      } else if (isGuestMode && existingProfile) {
        // For guest users, use existing profile with defaults
        setUserProfile({
          ...existingProfile,
          tier: 'bronze',
          listingsAdded: 0,
          listingsUpdated: 0,
          dataQualityScore: 0,
          emailNotifications: false,
        });
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    loadExtendedProfile();
  }, [currentUser, existingProfile, isGuestMode]);

  // Provide signOut alias for logout
  const signOut = async () => {
    await logout();
  };

  // Update profile with extended fields
  const updateProfile = async (updates) => {
    if (currentUser && !isGuestMode) {
      await updateFirestoreProfile(currentUser.uid, updates);
      setUserProfile((prev) => ({ ...prev, ...updates }));
    }
    // Also update context profile
    updateContextProfile(updates);
  };

  return {
    user: currentUser,
    userProfile,
    loading,
    isGuestMode,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    login,
    signup,
    resetPassword,
    updateUserProfile: updateProfile,
  };
};

export default useAuth;
