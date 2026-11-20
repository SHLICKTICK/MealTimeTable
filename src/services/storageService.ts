/**
 * Storage Service using IndexedDB as the single authoritative source of truth,
 * with localStorage/in-memory fallback only when IndexedDB is unavailable.
 *
 * Supports atomic multi-store readwrite transactions via `commitBatch`.
 */

const DB_NAME = 'MealWeekDB';
const DB_VERSION = 3;
const STORES = {
  RECIPES: 'recipes',
  WEEKLY_PLANS: 'weekly_plans',
  SHOPPING_LIST: 'shopping_list',
  SETTINGS: 'settings',
  INVENTORY: 'inventory',
  COMPLETIONS: 'meal_completions',
  TRANSACTIONS: 'inventory_transactions',
  INGREDIENT_CATALOG: 'ingredient_catalog',
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES] | string;

export type StorageBatchOp =
  | { type: 'set'; storeName: string; item: { id?: string; key?: string } & Record<string, unknown> }
  | { type: 'remove'; storeName: string; key: string };

const IDB_AUTHORITY_KEY = 'idb_authority_v1';

export class StorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private memoryFallback: Map<string, Map<string, string>> = new Map();

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
      let settled = false;
      const finish = (db: IDBDatabase | null) => {
        if (settled) return;
        settled = true;
        resolve(db);
      };

      const timeoutId = setTimeout(() => {
        console.warn('IndexedDB open timed out, falling back to localStorage');
        finish(null);
      }, 1500);

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
          if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
            db.createObjectStore(STORES.INVENTORY, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.COMPLETIONS)) {
            db.createObjectStore(STORES.COMPLETIONS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
            db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.INGREDIENT_CATALOG)) {
            db.createObjectStore(STORES.INGREDIENT_CATALOG, { keyPath: 'id' });
          }
        };

        request.onsuccess = async () => {
          clearTimeout(timeoutId);
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            this.dbPromise = null;
          };
          await this.ensureIdbAuthorityRecovery(db);
          finish(db);
        };

        request.onblocked = () => {
          clearTimeout(timeoutId);
          console.warn('IndexedDB upgrade blocked by another connection, falling back to localStorage');
          finish(null);
        };

        request.onerror = (e) => {
          clearTimeout(timeoutId);
          console.warn('IndexedDB open error, using localStorage fallback', e);
          finish(null);
        };
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn('IndexedDB exception, using localStorage fallback', err);
        finish(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * One-time idempotent recovery of any legacy localStorage-only records into IndexedDB
   * without overwriting valid existing IndexedDB data and without bumping DB_VERSION.
   * Once recorded, IndexedDB is strictly authoritative and localStorage will never override it.
   */
  private async ensureIdbAuthorityRecovery(db: IDBDatabase): Promise<void> {
    try {
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) return;

      const marker = await new Promise<unknown>((resolve) => {
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
        const req = tx.objectStore(STORES.SETTINGS).get(IDB_AUTHORITY_KEY);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });

      if (marker) return;

      const storeValues = Object.values(STORES).filter((s) => db.objectStoreNames.contains(s));
      const legacyEntries: Array<{ storeName: string; key: string; item: Record<string, unknown> }> = [];

      if (typeof localStorage !== 'undefined') {
        for (const storeName of storeValues) {
          const prefix = `${storeName}:`;
          for (let i = 0; i < localStorage.length; i++) {
            const fullKey = localStorage.key(i);
            if (fullKey && fullKey.startsWith(prefix)) {
              const raw = localStorage.getItem(fullKey);
              if (!raw) continue;
              try {
                const parsed = JSON.parse(raw) as Record<string, unknown>;
                const recordKey = fullKey.slice(prefix.length);
                if (parsed && typeof parsed === 'object' && recordKey) {
                  legacyEntries.push({ storeName, key: recordKey, item: parsed });
                }
              } catch {
                // Skip malformed legacy localStorage item
              }
            }
          }
        }
      }

      if (legacyEntries.length > 0) {
        const storesToOpen = Array.from(new Set([STORES.SETTINGS, ...legacyEntries.map((e) => e.storeName)]));
        await new Promise<void>((resolve) => {
          const tx = db.transaction(storesToOpen, 'readwrite');
          for (const entry of legacyEntries) {
            const store = tx.objectStore(entry.storeName);
            const getReq = store.get(entry.key);
            getReq.onsuccess = () => {
              // Only backfill into IDB if IDB has no record for this key
              if (getReq.result === undefined) {
                store.put(entry.item);
              }
            };
          }
          tx.objectStore(STORES.SETTINGS).put({
            key: IDB_AUTHORITY_KEY,
            value: new Date().toISOString(),
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        });
      } else {
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORES.SETTINGS, 'readwrite');
          tx.objectStore(STORES.SETTINGS).put({
            key: IDB_AUTHORITY_KEY,
            value: new Date().toISOString(),
          });
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        });
      }
    } catch (err) {
      console.warn('IndexedDB authority check encountered an issue:', err);
    }
  }

  /**
   * Resets cached DB connection (used in tests or after db.onversionchange).
   */
  resetConnection(): void {
    this.dbPromise = null;
    this.memoryFallback.clear();
  }

  async isIndexedDbActive(): Promise<boolean> {
    const db = await this.initDB();
    return db !== null;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.initDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      return await new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
        req.onerror = () => reject(req.error || new Error(`IndexedDB get failed for ${storeName}:${key}`));
      });
    }
    return this.getLocalFallback<T>(storeName, key);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.initDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      return await new Promise<T[]>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => reject(req.error || new Error(`IndexedDB getAll failed for ${storeName}`));
      });
    }
    return this.getLocalAllFallback<T>(storeName);
  }

  async set<T extends { id?: string; key?: string }>(storeName: string, item: T): Promise<void> {
    const db = await this.initDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const req = store.put(item);
        req.onerror = () => reject(req.error || new Error(`IndexedDB put error for ${storeName}`));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error || new Error(`IndexedDB transaction error for ${storeName}`));
        transaction.onabort = () =>
          reject(transaction.error || new Error(`IndexedDB transaction aborted for ${storeName}`));
      });
      return;
    }

    const key = item.id || item.key;
    if (key) {
      this.setLocalFallback(storeName, key, item);
    }
  }

  async setAll<T extends { id?: string; key?: string }>(storeName: string, items: T[]): Promise<void> {
    if (items.length === 0) return;
    await this.commitBatch(
      [storeName],
      items.map((item) => ({
        type: 'set' as const,
        storeName,
        item: item as unknown as { id?: string; key?: string } & Record<string, unknown>,
      }))
    );
  }

  async remove(storeName: string, key: string): Promise<void> {
    const db = await this.initDB();
    if (db && db.objectStoreNames.contains(storeName)) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const req = store.delete(key);
        req.onerror = () => reject(req.error || new Error(`IndexedDB delete error for ${storeName}:${key}`));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () =>
          reject(transaction.error || new Error(`IndexedDB delete transaction error for ${storeName}`));
        transaction.onabort = () =>
          reject(transaction.error || new Error(`IndexedDB delete transaction aborted for ${storeName}`));
      });
      return;
    }

    this.removeLocalFallback(storeName, key);
  }

  /**
   * Executes multiple store writes/deletes inside a single atomic IndexedDB transaction.
   * If any operation fails, IndexedDB rolls back the entire transaction.
   */
  async commitBatch(storeNames: string[], ops: StorageBatchOp[]): Promise<void> {
    if (ops.length === 0) return;
    const uniqueStores = Array.from(new Set([...storeNames, ...ops.map((o) => o.storeName)]));
    const db = await this.initDB();

    if (db && uniqueStores.every((s) => db.objectStoreNames.contains(s))) {
      await new Promise<void>((resolve, reject) => {
        let tx: IDBTransaction;
        try {
          tx = db.transaction(uniqueStores, 'readwrite');
        } catch (err) {
          reject(err);
          return;
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('Atomic IndexedDB batch transaction failed.'));
        tx.onabort = () => reject(tx.error || new Error('Atomic IndexedDB batch transaction aborted.'));

        for (const op of ops) {
          const store = tx.objectStore(op.storeName);
          if (op.type === 'set') {
            store.put(op.item);
          } else {
            store.delete(op.key);
          }
        }
      });
      return;
    }

    // Fallback mode (only when IndexedDB is unavailable): snapshot & rollback on failure
    const snapshot = new Map<string, string | null>();
    const snapshotKey = (storeName: string, key: string) => `${storeName}:${key}`;

    try {
      for (const op of ops) {
        const key = op.type === 'set' ? op.item.id || op.item.key || '' : op.key;
        if (!key) continue;
        const sk = snapshotKey(op.storeName, key);
        if (!snapshot.has(sk)) {
          snapshot.set(sk, this.getRawLocalFallback(op.storeName, key));
        }
      }

      for (const op of ops) {
        if (op.type === 'set') {
          const key = op.item.id || op.item.key;
          if (!key) {
            throw new Error(`Missing key/id for batch write in ${op.storeName}`);
          }
          this.setLocalFallback(op.storeName, key, op.item);
        } else {
          this.removeLocalFallback(op.storeName, op.key);
        }
      }
    } catch (err) {
      for (const [sk, prevRaw] of snapshot.entries()) {
        const sepIdx = sk.indexOf(':');
        const storeName = sk.slice(0, sepIdx);
        const key = sk.slice(sepIdx + 1);
        if (prevRaw === null) {
          this.removeLocalFallback(storeName, key);
        } else {
          this.setRawLocalFallback(storeName, key, prevRaw);
        }
      }
      throw err;
    }
  }

  // Fallback helpers (used ONLY when IndexedDB is unavailable)
  private getStoreMemMap(store: string): Map<string, string> {
    let map = this.memoryFallback.get(store);
    if (!map) {
      map = new Map<string, string>();
      this.memoryFallback.set(store, map);
    }
    return map;
  }

  private getRawLocalFallback(store: string, key: string): string | null {
    const memVal = this.getStoreMemMap(store).get(key);
    if (memVal !== undefined) return memVal;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`${store}:${key}`);
        if (raw !== null) {
          this.getStoreMemMap(store).set(key, raw);
          return raw;
        }
      }
    } catch {
      // Ignore storage access errors
    }
    return null;
  }

  private setRawLocalFallback(store: string, key: string, raw: string): void {
    this.getStoreMemMap(store).set(key, raw);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`${store}:${key}`, raw);
      }
    } catch {
      // Memory fallback still retains current state in non-IDB environments
    }
  }

  private getLocalFallback<T>(store: string, key: string): T | null {
    try {
      const raw = this.getRawLocalFallback(store, key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private getLocalAllFallback<T>(store: string): T[] {
    try {
      const resultMap = new Map<string, T>();
      const prefix = `${store}:`;

      if (typeof localStorage !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            const val = localStorage.getItem(k);
            if (val) {
              const itemKey = k.slice(prefix.length);
              resultMap.set(itemKey, JSON.parse(val) as T);
            }
          }
        }
      }

      const memMap = this.getStoreMemMap(store);
      for (const [k, raw] of memMap.entries()) {
        resultMap.set(k, JSON.parse(raw) as T);
      }

      return Array.from(resultMap.values());
    } catch {
      return [];
    }
  }

  private setLocalFallback<T>(store: string, key: string, item: T): void {
    this.setRawLocalFallback(store, key, JSON.stringify(item));
  }

  private removeLocalFallback(store: string, key: string): void {
    this.getStoreMemMap(store).delete(key);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`${store}:${key}`);
      }
    } catch {
      // Ignore
    }
  }
}

export const storageService = new StorageService();
export { STORES };
