import type { PersistedWorkspaceState } from "../types";

const DB_NAME = "brain-os";
const STORE_NAME = "workspace-state";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

export async function loadWorkspaceState(scope: string): Promise<PersistedWorkspaceState | null> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(scope);

    request.onsuccess = () => {
      resolve((request.result as PersistedWorkspaceState | undefined) ?? null);
    };

    request.onerror = () => reject(request.error ?? new Error("Failed to load workspace state."));
  });
}

export async function saveWorkspaceState(scope: string, value: PersistedWorkspaceState): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, scope);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Failed to save workspace state."));
  });
}
