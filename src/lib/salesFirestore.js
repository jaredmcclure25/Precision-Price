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
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 50)
    + '-' + Date.now().toString(36);
}

// ─── Sale Sessions ────────────────────────────────────────────────────────────

/**
 * Create a new sale session.
 * @param {string} userId
 * @param {string|Object} nameOrOptions  String (legacy) or { saleName, description, saleDate, endDate, address }
 * @returns {Promise<string>} saleId
 */
export const createSale = async (userId, nameOrOptions = '') => {
  const opts = typeof nameOrOptions === 'string' ? { saleName: nameOrOptions } : (nameOrOptions || {});
  const name = opts.saleName || `Sale – ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  const salesRef = collection(db, 'sales');
  const saleDoc = await addDoc(salesRef, {
    userId,
    saleName: name,
    slug: generateSlug(name),
    description: opts.description || '',
    saleDate: opts.saleDate || '',
    endDate: opts.endDate || '',
    address: opts.address || '',
    status: 'drafting',
    totalItems: 0,
    totalRooms: 0,
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

// ─── Rooms ────────────────────────────────────────────────────────────────────

/** Add a room to a sale */
export const addRoom = async (saleId, name, sortOrder = 0) => {
  const roomsRef = collection(db, 'sales', saleId, 'rooms');
  const roomDoc = await addDoc(roomsRef, {
    name,
    sortOrder,
    itemCount: 0,
    totalValue: 0,
    createdAt: serverTimestamp(),
  });
  const saleRef = doc(db, 'sales', saleId);
  const snap = await getDoc(saleRef);
  await updateDoc(saleRef, { totalRooms: (snap.data()?.totalRooms || 0) + 1, updatedAt: serverTimestamp() });
  return roomDoc.id;
};

/** Get all rooms for a sale, ordered by sortOrder */
export const getRooms = async (saleId) => {
  const q = query(collection(db, 'sales', saleId, 'rooms'), orderBy('sortOrder', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
};

/** Get a single room */
export const getRoom = async (saleId, roomId) => {
  const snap = await getDoc(doc(db, 'sales', saleId, 'rooms', roomId));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
};

/** Update room fields (name, sortOrder, etc.) */
export const updateRoom = async (saleId, roomId, updates) => {
  await updateDoc(doc(db, 'sales', saleId, 'rooms', roomId), { ...updates, updatedAt: serverTimestamp() });
};

/** Delete a room and all its items */
export const deleteRoom = async (saleId, roomId) => {
  const items = await getRoomItems(saleId, roomId);
  for (const item of items) {
    await deleteDoc(doc(db, 'sales', saleId, 'items', item.id));
  }
  await deleteDoc(doc(db, 'sales', saleId, 'rooms', roomId));
  const saleRef = doc(db, 'sales', saleId);
  const snap = await getDoc(saleRef);
  const current = snap.data()?.totalRooms || 1;
  await updateDoc(saleRef, { totalRooms: Math.max(0, current - 1), updatedAt: serverTimestamp() });
};

/** Update the selectedPrice on a single item (used by price tier selector) */
export const updateItemPrice = async (saleId, itemId, selectedPrice) => {
  await updateDoc(doc(db, 'sales', saleId, 'items', itemId), {
    selectedPrice,
    updatedAt: serverTimestamp(),
  });
};

/** Get items that belong to a specific room.
 *  Uses a single where() — no composite index required. */
export const getRoomItems = async (saleId, roomId) => {
  const q = query(
    collection(db, 'sales', saleId, 'items'),
    where('roomId', '==', roomId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map(d => ({ ...d.data(), id: d.id, createdAt: d.data().createdAt?.toDate?.() || new Date() }));
  // Sort client-side to avoid needing a composite index
  return docs.sort((a, b) => a.createdAt - b.createdAt);
};

/** Add a batch of priced items to a specific room within a sale */
export const addRoomItems = async (saleId, roomId, items) => {
  const itemIds = [];
  for (const item of items) {
    const itemRef = collection(db, 'sales', saleId, 'items');
    const newDoc = await addDoc(itemRef, {
      ...item,
      roomId,
      outcome: null,
      soldPrice: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    itemIds.push(newDoc.id);
  }
  // Update room stats using the room doc's existing counts + new batch size
  // (avoids a compound query that would need a composite index)
  const roomSnap = await getDoc(doc(db, 'sales', saleId, 'rooms', roomId));
  const prevCount = roomSnap.data()?.itemCount || 0;
  const prevValue = roomSnap.data()?.totalValue || 0;
  const addedValue = items.reduce((s, i) => s + (i.selectedPrice ?? i.aiPriceMedium ?? 0), 0);
  await updateDoc(doc(db, 'sales', saleId, 'rooms', roomId), {
    itemCount: prevCount + items.length,
    totalValue: prevValue + addedValue,
    updatedAt: serverTimestamp(),
  });
  // Update sale total
  const saleRef = doc(db, 'sales', saleId);
  const snap = await getDoc(saleRef);
  await updateDoc(saleRef, { totalItems: (snap.data()?.totalItems || 0) + items.length, updatedAt: serverTimestamp() });
  return itemIds;
};
