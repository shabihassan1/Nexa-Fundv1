/**
 * Debug utilities for development
 */

/**
 * Safely log objects to console with circular reference handling
 */
export const safeLog = (label: string, obj: any) => {
  try {
    // Create a safe copy without circular references
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key: string, value: any) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      };
    };

    // Convert to JSON and back to handle circular references
    const safeObj = JSON.parse(JSON.stringify(obj, getCircularReplacer()));
    
    console.log(`${label}:`, safeObj);
    return safeObj;
  } catch (err) {
    console.error(`Error logging ${label}:`, err);
    return null;
  }
};

/**
 * Check if localStorage is available and working
 */
export const checkLocalStorage = () => {
  try {
    const testKey = '__test_storage__';
    localStorage.setItem(testKey, 'test');
    const testValue = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return testValue === 'test';
  } catch (e) {
    return false;
  }
};

/**
 * Get localStorage usage statistics
 */
export const getLocalStorageStats = () => {
  try {
    const total = 5 * 1024 * 1024; // Approximate 5MB limit
    let used = 0;
    let count = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        used += key.length + value.length;
        count++;
      }
    }
    
    return {
      totalItems: count,
      usedBytes: used,
      usedMB: (used / (1024 * 1024)).toFixed(2),
      percentUsed: ((used / total) * 100).toFixed(2),
      available: checkLocalStorage()
    };
  } catch (e) {
    return {
      error: 'Could not access localStorage',
      available: false
    };
  }
};

/**
 * List all keys in localStorage with a specific prefix
 */
export const listLocalStorageKeys = (prefix: string = '') => {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  } catch (e) {
    return [];
  }
}; 