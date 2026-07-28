import { createSqliteKeyValueStore, type KeyValueStore } from "../../apps/api/src/persistence";

let sharedStore: KeyValueStore | undefined;

/**
 * Compatibility facade for existing browser-sync imports. The Vite adapter and
 * Bun API now use this exact KeyValueStore implementation, including its
 * SQLite and JSON fallback behavior.
 */
export function getSharedKeyValueStore(): KeyValueStore {
  sharedStore ??= createSqliteKeyValueStore();
  return sharedStore;
}

export function getAllState(): Record<string, string> {
  return getSharedKeyValueStore().getAll();
}

export function setKeyValue(key: string, value: string): void {
  getSharedKeyValueStore().set(key, value);
}

export function removeKeyValue(key: string): void {
  getSharedKeyValueStore().delete(key);
}

export function clearKeysByPrefix(prefix: string): void {
  getSharedKeyValueStore().clearPrefix(prefix);
}

/** Test-only injection seam; passing undefined restores the production store. */
export function setSharedKeyValueStoreForTesting(store: KeyValueStore | undefined): void {
  sharedStore?.close?.();
  sharedStore = store;
}
