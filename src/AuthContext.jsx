/**
 * Precision Prices - Authentication Context
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  linkWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Helper function to get friendly provider name
function getProviderName(providerId) {
  switch (providerId) {
    case 'google.com':
      return 'Google';
    case 'facebook.com':
      return 'Facebook';
    case 'password':
      return 'email/password';
    default:
      return providerId;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);

  // Sign up new user
  async function signup(email, password, displayName, industry = null) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // If there was a pending credential, link it
    if (pendingCredential) {
      try {
        await linkWithCredential(user, pendingCredential);
        setPendingCredential(null);
        setPendingEmail(null);
      } catch (linkError) {
        // Could not link credential - continue anyway
      }
    }

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName || '',
      industry: industry, // Industry selected at signup
      tier: 'free', // Freemium tier
      providers: ['password'],
      createdAt: new Date().toISOString(),
      badges: [],
      streak: 0,
      totalEarnings: 0,
      analysisCount: 0,
      perfectPrices: 0,
      level: 1
    });

    return user;
  }

  // Log in existing user
  async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // If there was a pending credential, link it
    if (pendingCredential) {
      try {
        await linkWithCredential(user, pendingCredential);
        setPendingCredential(null);
        setPendingEmail(null);

        // Update providers list in Firestore
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const providers = data.providers || ['password'];
          // Add the new provider from the linked credential
          const newProvider = pendingCredential.providerId?.replace('.com', '') || 'unknown';
          if (!providers.includes(newProvider)) {
            await setDoc(docRef, { providers: [...providers, newProvider] }, { merge: true });
          }
        }
      } catch (linkError) {
        // Could not link credential - continue anyway
      }
    }

    return user;
  }

  // Send password reset email
  function resetPassword(email) {
    const actionCodeSettings = {
      url: window.location.origin + '/',
      handleCodeInApp: false,
    };
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  }

  // Sign in with Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // If there was a pending credential, link it
      if (pendingCredential) {
        try {
          await linkWithCredential(user, pendingCredential);
          setPendingCredential(null);
          setPendingEmail(null);
        } catch (linkError) {
          // Could not link credential - continue anyway
        }
      }

      // Check if this is a new user
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Create user profile for new Google users
        await setDoc(docRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          industry: null, // Will be set during onboarding
          tier: 'free',
          providers: ['google'],
          createdAt: new Date().toISOString(),
          badges: [],
          streak: 0,
          totalEarnings: 0,
          analysisCount: 0,
          perfectPrices: 0,
          level: 1
        });
      } else {
        // Update providers list if not already included
        const data = docSnap.data();
        const providers = data.providers || [data.provider || 'google'];
        if (!providers.includes('google')) {
          await setDoc(docRef, { providers: [...providers, 'google'] }, { merge: true });
        }
      }

      return user;
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        // Save the pending credential for later linking
        const credential = GoogleAuthProvider.credentialFromError(error);
        const email = error.customData?.email;

        if (credential && email) {
          setPendingCredential(credential);
          setPendingEmail(email);

          // Get sign-in methods for this email
          const methods = await fetchSignInMethodsForEmail(auth, email);

          // Create a custom error with provider info
          const customError = new Error(
            `This email is already registered. Please sign in with ${getProviderName(methods[0])} first to link your accounts.`
          );
          customError.code = 'auth/account-exists-with-different-credential';
          customError.existingProvider = methods[0];
          customError.email = email;
          throw customError;
        }
      }
      throw error;
    }
  }

  // Sign in with Facebook
  async function signInWithFacebook() {
    const provider = new FacebookAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // If there was a pending credential, link it
      if (pendingCredential) {
        try {
          await linkWithCredential(user, pendingCredential);
          setPendingCredential(null);
          setPendingEmail(null);
        } catch (linkError) {
          // Could not link credential - continue anyway
        }
      }

      // Check if this is a new user
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Create user profile for new Facebook users
        await setDoc(docRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          industry: null, // Will be set during onboarding
          tier: 'free',
          providers: ['facebook'],
          createdAt: new Date().toISOString(),
          badges: [],
          streak: 0,
          totalEarnings: 0,
          analysisCount: 0,
          perfectPrices: 0,
          level: 1
        });
      } else {
        // Update providers list if not already included
        const data = docSnap.data();
        const providers = data.providers || [data.provider || 'facebook'];
        if (!providers.includes('facebook')) {
          await setDoc(docRef, { providers: [...providers, 'facebook'] }, { merge: true });
        }
      }

      return user;
    } catch (error) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        // Save the pending credential for later linking
        const credential = FacebookAuthProvider.credentialFromError(error);
        const email = error.customData?.email;

        if (credential && email) {
          setPendingCredential(credential);
          setPendingEmail(email);

          // Get sign-in methods for this email
          const methods = await fetchSignInMethodsForEmail(auth, email);

          // Create a custom error with provider info
          const customError = new Error(
            `This email is already registered. Please sign in with ${getProviderName(methods[0])} first to link your accounts.`
          );
          customError.code = 'auth/account-exists-with-different-credential';
          customError.existingProvider = methods[0];
          customError.email = email;
          throw customError;
        }
      }
      throw error;
    }
  }

  // Log out user
  async function logout() {
    setIsGuestMode(false);
    await window.storage.remove('isGuestMode');
    await window.storage.remove('guestProfile');
    await window.storage.remove('itemHistory');
    return signOut(auth);
  }

  // Enable guest mode
  async function enableGuestMode() {
    setIsGuestMode(true);

    // Persist guest mode status
    await window.storage.set('isGuestMode', 'true');

    // Load or create guest profile from localStorage
    try {
      const stored = await window.storage.get('guestProfile');
      if (stored && stored.value) {
        setUserProfile(JSON.parse(stored.value));
      } else {
        const guestProfile = {
          displayName: 'Guest',
          badges: [],
          streak: 0,
          totalEarnings: 0,
          analysisCount: 0,
          guestAttempts: 0,
          perfectPrices: 0,
          level: 1,
          lastAnalysisTime: null,
          cooldownStartTime: null
        };
        await window.storage.set('guestProfile', JSON.stringify(guestProfile));
        setUserProfile(guestProfile);
      }
    } catch (e) {
      const guestProfile = {
        displayName: 'Guest',
        badges: [],
        streak: 0,
        totalEarnings: 0,
        analysisCount: 0,
        guestAttempts: 0,
        perfectPrices: 0,
        level: 1,
        lastAnalysisTime: null,
        cooldownStartTime: null
      };
      setUserProfile(guestProfile);
    }

    setLoading(false);
  }

  // Load user profile from Firestore
  async function loadUserProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Update user profile in Firestore or localStorage
  async function updateUserProfile(updates) {
    if (isGuestMode) {
      // Update guest profile in localStorage
      try {
        const updated = { ...userProfile, ...updates };
        await window.storage.set('guestProfile', JSON.stringify(updated));
        setUserProfile(updated);
      } catch (error) {
        console.error('Error updating guest profile:', error);
      }
    } else if (currentUser) {
      // Update Firebase profile
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, updates, { merge: true });
        setUserProfile(prev => ({ ...prev, ...updates }));
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }
  }

  // Save item analysis to history
  async function saveItemToHistory(itemData) {
    const historyItem = {
      ...itemData,
      analyzedAt: new Date().toISOString()
    };

    if (isGuestMode) {
      // Save to localStorage for guest users
      try {
        const stored = await window.storage.get('itemHistory');
        const history = stored && stored.value ? JSON.parse(stored.value) : [];
        history.unshift(historyItem); // Add to beginning

        // Keep only last 50 items for guests
        if (history.length > 50) {
          history.length = 50;
        }

        await window.storage.set('itemHistory', JSON.stringify(history));
        return historyItem;
      } catch (error) {
        console.error('Error saving to guest history:', error);
        return null;
      }
    } else if (currentUser) {
      // Save to Firestore for logged-in users
      try {
        const itemsRef = collection(db, 'users', currentUser.uid, 'items');
        const docRef = await addDoc(itemsRef, historyItem);
        return { id: docRef.id, ...historyItem };
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        return null;
      }
    }
  }

  // Get item history
  async function getItemHistory(limitCount = 50) {
    if (isGuestMode) {
      // Get from localStorage for guest users
      try {
        const stored = await window.storage.get('itemHistory');
        return stored && stored.value ? JSON.parse(stored.value) : [];
      } catch (error) {
        console.error('Error loading guest history:', error);
        return [];
      }
    } else if (currentUser) {
      // Get from Firestore for logged-in users
      try {
        const itemsRef = collection(db, 'users', currentUser.uid, 'items');
        const q = query(itemsRef, orderBy('analyzedAt', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);

        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });

        return items;
      } catch (error) {
        console.error('Error loading Firestore history:', error);
        return [];
      }
    }
    return [];
  }

  // Update item in history (for marking as sold, etc.)
  async function updateItemInHistory(itemId, updateData) {
    if (isGuestMode) {
      // Update in localStorage for guest users
      try {
        const stored = await window.storage.get('itemHistory');
        if (stored?.value) {
          const items = JSON.parse(stored.value);
          const index = items.findIndex(item => item.id === itemId);
          if (index !== -1) {
            items[index] = { ...items[index], ...updateData };
            await window.storage.set('itemHistory', JSON.stringify(items));
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Error updating guest history:', error);
        return false;
      }
    } else if (currentUser) {
      // Update in Firestore for logged-in users
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const itemRef = doc(db, 'users', currentUser.uid, 'items', itemId);
        await updateDoc(itemRef, updateData);
        return true;
      } catch (error) {
        console.error('Error updating Firestore item:', error);
        return false;
      }
    }
    return false;
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
        setLoading(false);
      } else {
        // Check if user was in guest mode
        try {
          const stored = await window.storage.get('isGuestMode');
          if (stored && stored.value === 'true') {
            await enableGuestMode();
          } else {
            setUserProfile(null);
            setLoading(false);
          }
        } catch (e) {
          setUserProfile(null);
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Clear pending credential (for canceling linking flow)
  function clearPendingCredential() {
    setPendingCredential(null);
    setPendingEmail(null);
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    isGuestMode,
    pendingCredential,
    pendingEmail,
    signup,
    login,
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
    logout,
    enableGuestMode,
    updateUserProfile,
    saveItemToHistory,
    getItemHistory,
    updateItemInHistory,
    clearPendingCredential
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
