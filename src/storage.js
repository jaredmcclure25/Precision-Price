/**
 * Cross-browser storage wrapper
 * Works on Safari, Chrome, Edge, and Firefox
 * Falls back gracefully if localStorage is unavailable
 */

const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return { value };
    } catch (error) {
      console.warn('localStorage not available:', error);
      return { value: null };
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return false;
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return false;
    }
  },

  async clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return false;
    }
  }
};

// Make it available globally for compatibility
if (typeof window !== 'undefined') {
  window.storage = storage;
}

export default storage;
