export const StorageService = {
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn(`Error reading from localStorage: ${key}`, e);
      return null;
    }
  },
  
  getString: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Error reading string from localStorage: ${key}`, e);
      return null;
    }
  },

  setItem: <T>(key: string, value: T): void => {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Error saving to localStorage: ${key}`, e);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing from localStorage: ${key}`, e);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(`Error clearing localStorage`, e);
    }
  }
};
