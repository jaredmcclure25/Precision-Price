/**
 * PrecisionPrices - Firestore Operations for Estate Sale Sessions & Items
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Sale Sessions ────────────────────────────────────────────────────────────

/**
 * Create a new sale session
 * @param {string} userId
 * @param {string} saleName  e.g. "Johnson Estate – March 2026"
 * @returns {Promise<string>} saleId
 */
export const createSale = async (userId, saleName = '') => {
  const salesRef = collection(db, 'sales');
  const saleDoc = await addDoc(salesRef, {
    userId,
    saleName: saleName || `Sale – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    status: 'pricing',
    totalItems: 0,
    totalSold: 0,
    totalRevenue: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return saleDoc.id;
};

/**
 * Get all sales for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getUserSales = async (userId) => {
  const salesRef = collection(db, 'sales');
  const q = query(
    salesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: d.data().createdAt?.toDate?.() || new Date(),
  }));
};

/**
 * Get a single sale
 * @param {string} saleId
 * @returns {Promise<Object|null>}
 */
export const getSale = async (saleId) => {
  const saleRef = doc(db, 'sales', saleId);
  const snap = await getDoc(saleRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, id: snap.id, createdAt: data.createdAt?.toDate?.() || new Date() };
};

/**
 * Update sale status
 * @param {string} saleId
 * @param {'pricing'|'active'|'completed'|'reviewed'} status
 */
export const updateSaleStatus = async (saleId, status) => {
  const saleRef = doc(db, 'sales', saleId);
  await updateDoc(saleRef, { status, updatedAt: serverTimestamp() });
};

// ─── Sale Items ───────────────────────────────────────────────────────────────

/**
 * Add a batch of priced items to a sale
 * @param {string} saleId
 * @param {Array} items  array of pricing results from Claude
 * @returns {Promise<string[]>} itemIds
 */
export const addSaleItems = async (saleId, items) => {
  const itemIds = [];
  for (const item of items) {
    const itemRef = collection(db, 'sales', saleId, 'items');
    const newDoc = await addDoc(itemRef, {
      ...item,
      outcome: null,
      soldPrice: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    itemIds.push(newDoc.id);
  }
  // Update totalItems on parent sale
  const saleRef = doc(db, 'sales', saleId);
  const saleSnap = await getDoc(saleRef);
  const current = saleSnap.data()?.totalItems || 0;
  await updateDoc(saleRef, { totalItems: current + items.length, updatedAt: serverTimestamp() });
  return itemIds;
};

/**
 * Get all items for a sale
 * @param {string} saleId
 * @returns {Promise<Array>}
 */
export const getSaleItems = async (saleId) => {
  const itemsRef = collection(db, 'sales', saleId, 'items');
  const q = query(itemsRef, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: d.data().createdAt?.toDate?.() || new Date(),
  }));
};

/**
 * Record the outcome of a single item after the sale
 * @param {string} saleId
 * @param {string} itemId
 * @param {'sold'|'unsold'|'skip'} outcome
 * @param {number|null} soldPrice
 */
export const updateItemOutcome = async (saleId, itemId, outcome, soldPrice = null) => {
  const itemRef = doc(db, 'sales', saleId, 'items', itemId);
  await updateDoc(itemRef, {
    outcome,
    soldPrice: outcome === 'sold' ? soldPrice : null,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Bulk-mark remaining null-outcome items as unsold
 * @param {string} saleId
 */
export const markRemainingUnsold = async (saleId) => {
  const items = await getSaleItems(saleId);
  const pending = items.filter(i => !i.outcome || i.outcome === null);
  for (const item of pending) {
    await updateItemOutcome(saleId, item.id, 'unsold', null);
  }
};

/**
 * Compute summary stats for a sale
 * @param {string} saleId
 * @returns {Promise<Object>}
 */
export const getSaleSummary = async (saleId) => {
  const items = await getSaleItems(saleId);
  const reviewed = items.filter(i => i.outcome && i.outcome !== 'skip');
  const sold = reviewed.filter(i => i.outcome === 'sold');
  const totalRevenue = sold.reduce((sum, i) => sum + (i.soldPrice || 0), 0);
  const aiAccuracyValues = sold
    .filter(i => i.soldPrice && i.aiPriceMedium)
    .map(i => i.soldPrice / i.aiPriceMedium);
  const avgAccuracy = aiAccuracyValues.length
    ? aiAccuracyValues.reduce((a, b) => a + b, 0) / aiAccuracyValues.length
    : null;

  // Persist summary back to sale doc
  const saleRef = doc(db, 'sales', saleId);
  await updateDoc(saleRef, {
    totalSold: sold.length,
    totalRevenue,
    avgAiAccuracy: avgAccuracy,
    status: 'reviewed',
    updatedAt: serverTimestamp(),
  });

  return {
    totalItems: items.length,
    reviewedItems: reviewed.length,
    soldItems: sold.length,
    unsoldItems: reviewed.filter(i => i.outcome === 'unsold').length,
    totalRevenue,
    avgAccuracy,
    sellThroughRate: reviewed.length ? (sold.length / reviewed.length) : 0,
  };
};
