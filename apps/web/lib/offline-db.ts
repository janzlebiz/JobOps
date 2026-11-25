export interface OfflineSavedJob {
  jobId: string;
  title: string;
  platform: string;
  canonicalUrl: string;
  notes: string;
  savedAt: string;
}

export interface PendingSyncItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH';
  body: Record<string, unknown>;
  createdAt: string;
}

const DB_NAME = 'jobops-radar-offline';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('saved_jobs')) {
        db.createObjectStore('saved_jobs', { keyPath: 'jobId' });
      }
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheSavedJobOffline(item: OfflineSavedJob): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction('saved_jobs', 'readwrite');
    tx.objectStore('saved_jobs').put(item);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {
    // Non-blocking in SSR or restricted contexts
  }
}

export async function getOfflineSavedJobs(): Promise<OfflineSavedJob[]> {
  try {
    const db = await openDb();
    const tx = db.transaction('saved_jobs', 'readonly');
    const req = tx.objectStore('saved_jobs').getAll();
    return await new Promise((res, rej) => {
      req.onsuccess = () => res((req.result as OfflineSavedJob[]) ?? []);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return [];
  }
}

export async function enqueueOfflineSync(
  item: Omit<PendingSyncItem, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction('pending_sync', 'readwrite');
    tx.objectStore('pending_sync').put({
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // ignore
  }
}

export async function flushOfflineSyncQueue(): Promise<number> {
  try {
    const db = await openDb();
    const tx = db.transaction('pending_sync', 'readonly');
    const req = tx.objectStore('pending_sync').getAll();
    const items = await new Promise<PendingSyncItem[]>((res, rej) => {
      req.onsuccess = () => res((req.result as PendingSyncItem[]) ?? []);
      req.onerror = () => rej(req.error);
    });

    let synced = 0;
    for (const item of items) {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(item.body),
      });
      if (res.ok) {
        const delTx = db.transaction('pending_sync', 'readwrite');
        delTx.objectStore('pending_sync').delete(item.id);
        synced++;
      }
    }
    return synced;
  } catch {
    return 0;
  }
}
