/**
 * Storage Service using IndexedDB with fallback to localStorage.
 * Ensures data persists across browser reloads, restarts, and offline sessions.
 */

const DB_NAME = 'MealWeekDB';
const DB_VERSION = 1;
const STORES = {
  RECIPES: 'recipes',
  WEEKLY_PLANS: 'weekly_plans',
  SHOPPING_LIST: 'shopping_list',
  SETTINGS: 'settings',
};

class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported in this environment, falling back to localStorage');
      this.dbPromise = Promise.resolve(null);
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORES.RECIPES)) {
            db.createObjectStore(STORES.RECIPES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.WEEKLY_PLANS)) {
            db.createObjectStore(STORES.WEEKLY_PLANS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.SHOPPING_LIST)) {
            db.createObjectStore(STORES.SHOPPING_LIST, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (e) => {
          console.warn('IndexedDB open error, using localStorage fallback', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB exception, using localStorage fallback', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(this.getLocalFallback<T>(storeName, key));
        });
      }
    } catch {
      // Fallback
    }
    return this.getLocalFallback<T>(storeName, key);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => {
            const results = req.result || [];
            if (results.length > 0) {
              resolve(results);
            } else {
              resolve(this.getLocalAllFallback<T>(storeName));
            }
          };
          req.onerror = () => resolve(this.getLocalAllFallback<T>(storeName));
        });
      }
    } catch {
      // Fallback
    }
    return this.getLocalAllFallback<T>(storeName);
  }

  async set<T extends { id?: string; key?: string }>(storeName: string, item: T): Promise<void> {
    const key = item.id || item.key;
    if (key) {
      this.setLocalFallback(storeName, key, item);
    }

    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    } catch (err) {
      console.warn(`IndexedDB put failed for ${storeName}`, err);
    }
  }

  async setAll<T extends { id?: string; key?: string }>(storeName: string, items: T[]): Promise<void> {
    for (const item of items) {
      await this.set(storeName, item);
    }
  }

  async remove(storeName: string, key: string): Promise<void> {
    this.removeLocalFallback(storeName, key);
    try {
      const db = await this.initDB();
      if (db) {
        return new Promise((resolve) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }
    } catch {
      // Fallback handled
    }
  }

  // LocalStorage fallbacks
  private getLocalFallback<T>(store: string, key: string): T | null {
    try {
      const raw = localStorage.getItem(`${store}:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private getLocalAllFallback<T>(store: string): T[] {
    try {
      const items: T[] = [];
      const prefix = `${store}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          const val = localStorage.getItem(k);
          if (val) items.push(JSON.parse(val));
        }
      }
      return items;
    } catch {
      return [];
    }
  }

  private setLocalFallback<T>(store: string, key: string, item: T): void {
    try {
      localStorage.setItem(`${store}:${key}`, JSON.stringify(item));
    } catch {
      // Silently catch quota exceeded
    }
  }

  private removeLocalFallback(store: string, key: string): void {
    try {
      localStorage.removeItem(`${store}:${key}`);
    } catch {
      // Silently catch
    }
  }
}

export const storageService = new StorageService();
export { STORES };
