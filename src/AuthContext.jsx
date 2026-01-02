/**
 * Precision Prices - Authentication Context
 * Copyright © 2025 Jared McClure / PrecisionPrices.Com
 * All Rights Reserved.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
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

  // Log out user
  function logout() {
    setIsGuestMode(false);
    return signOut(auth);
  }

  // Enable guest mode
  async function enableGuestMode() {
    setIsGuestMode(true);

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
          perfectPrices: 0,
          level: 1
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
        perfectPrices: 0,
        level: 1
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

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isGuestMode,
    signup,
    login,
    logout,
    enableGuestMode,
    updateUserProfile,
    saveItemToHistory,
    getItemHistory
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
