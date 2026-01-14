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
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { auth, db } from './firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Sign up new user
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName || '',
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
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Send password reset email
  function resetPassword(email) {
    const actionCodeSettings = {
      url: 'https://precisionprices.com/',
      handleCodeInApp: false,
    };
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  }

  // Sign in with Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if this is a new user
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create user profile for new Google users
      await setDoc(docRef, {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        provider: 'google',
        createdAt: new Date().toISOString(),
        badges: [],
        streak: 0,
        totalEarnings: 0,
        analysisCount: 0,
        perfectPrices: 0,
        level: 1
      });
    }

    return user;
  }

  // Sign in with Facebook
  async function signInWithFacebook() {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if this is a new user
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Create user profile for new Facebook users
      await setDoc(docRef, {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        provider: 'facebook',
        createdAt: new Date().toISOString(),
        badges: [],
        streak: 0,
        totalEarnings: 0,
        analysisCount: 0,
        perfectPrices: 0,
        level: 1
      });
    }

    return user;
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

  // Check if guest has reached the attempt limit
  function hasReachedGuestLimit() {
    if (!isGuestMode || !userProfile) return false;

    // Check if cooldown has expired (12 hours = 43200000 ms)
    const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours
    if (userProfile.cooldownStartTime) {
      const cooldownEnd = new Date(userProfile.cooldownStartTime).getTime() + COOLDOWN_MS;
      if (Date.now() >= cooldownEnd) {
        // Cooldown expired - reset attempts
        resetGuestAttempts();
        return false;
      }
    }

    return userProfile.guestAttempts >= 2;
  }

  // Get remaining cooldown time in milliseconds
  function getCooldownRemaining() {
    if (!isGuestMode || !userProfile || !userProfile.cooldownStartTime) return 0;

    const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours
    const cooldownEnd = new Date(userProfile.cooldownStartTime).getTime() + COOLDOWN_MS;
    const remaining = cooldownEnd - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  // Reset guest attempts after cooldown
  async function resetGuestAttempts() {
    if (!isGuestMode) return;

    const updated = {
      ...userProfile,
      guestAttempts: 0,
      cooldownStartTime: null
    };
    await window.storage.set('guestProfile', JSON.stringify(updated));
    setUserProfile(updated);
  }

  // Start cooldown when guest hits limit
  async function startGuestCooldown() {
    if (!isGuestMode) return;

    const updated = {
      ...userProfile,
      cooldownStartTime: new Date().toISOString()
    };
    await window.storage.set('guestProfile', JSON.stringify(updated));
    setUserProfile(updated);
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

  const value = {
    currentUser,
    userProfile,
    isGuestMode,
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
    hasReachedGuestLimit,
    getCooldownRemaining,
    startGuestCooldown
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
