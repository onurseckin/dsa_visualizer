import { syncKeyToSqlite } from "../app/sqliteSync";

export const DRAFT_STORAGE_VERSION = 1;
export const DRAFT_STORAGE_PREFIX = "dsa_visualizer_playground_draft:";
export const DEFAULT_DRAFT_DEBOUNCE_MS = 400;

const MAX_DRAFT_LENGTH = 256 * 1024;
const ITEM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface DraftRecord {
  readonly version: typeof DRAFT_STORAGE_VERSION;
  readonly itemId: string;
  readonly code: string;
  readonly updatedAt: number;
}

export interface DraftStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface DraftStorage {
  load(itemId: string, fallback: string): string;
  scheduleSave(itemId: string, code: string): void;
  flush(itemId?: string): void;
  reset(itemId: string): void;
  dispose(): void;
}

export interface DraftStorageOptions {
  readonly debounceMs?: number;
  readonly now?: () => number;
  readonly storage?: DraftStorageLike | null;
  readonly sync?: (key: string, value: string | null) => void | Promise<void>;
}

interface PendingDraft {
  code: string;
  timer: ReturnType<typeof setTimeout>;
}

export function draftStorageKey(itemId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${itemId}`;
}

export function createDraftStorage(options: DraftStorageOptions = {}): DraftStorage {
  const debounceMs = normalizeDebounce(options.debounceMs);
  const now = options.now ?? Date.now;
  const sync = options.sync ?? syncKeyToSqlite;
  const pending = new Map<string, PendingDraft>();

  function selectedStorage(): DraftStorageLike | null {
    if (Object.hasOwn(options, "storage")) return options.storage ?? null;
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  }

  function write(itemId: string, code: string): void {
    if (!isCanonicalItemId(itemId) || !isValidCode(code)) return;
    const key = draftStorageKey(itemId);
    const value = JSON.stringify({
      version: DRAFT_STORAGE_VERSION,
      itemId,
      code,
      updatedAt: now(),
    } satisfies DraftRecord);
    try {
      selectedStorage()?.setItem(key, value);
    } catch {
      // Browser persistence is best-effort in restricted or full storage.
    }
    safelySync(sync, key, value);
  }

  function flushOne(itemId: string): void {
    const record = pending.get(itemId);
    if (!record) return;
    clearTimeout(record.timer);
    pending.delete(itemId);
    write(itemId, record.code);
  }

  return {
    load(itemId, fallback) {
      if (!isCanonicalItemId(itemId)) return fallback;
      let raw: string | null;
      try {
        raw = selectedStorage()?.getItem(draftStorageKey(itemId)) ?? null;
      } catch {
        return fallback;
      }
      if (raw === null) return fallback;
      try {
        const parsed: unknown = JSON.parse(raw);
        return isDraftRecord(parsed, itemId) ? parsed.code : fallback;
      } catch {
        return fallback;
      }
    },
    scheduleSave(itemId, code) {
      if (!isCanonicalItemId(itemId) || !isValidCode(code)) return;
      const current = pending.get(itemId);
      if (current) clearTimeout(current.timer);
      const timer = setTimeout(() => flushOne(itemId), debounceMs);
      pending.set(itemId, { code, timer });
    },
    flush(itemId) {
      if (itemId !== undefined) {
        flushOne(itemId);
        return;
      }
      for (const pendingItemId of [...pending.keys()]) flushOne(pendingItemId);
    },
    reset(itemId) {
      if (!isCanonicalItemId(itemId)) return;
      const record = pending.get(itemId);
      if (record) clearTimeout(record.timer);
      pending.delete(itemId);
      const key = draftStorageKey(itemId);
      try {
        selectedStorage()?.removeItem(key);
      } catch {
        // Reset remains best-effort when storage access is restricted.
      }
      safelySync(sync, key, null);
    },
    dispose() {
      for (const itemId of [...pending.keys()]) flushOne(itemId);
    },
  };
}

export const playgroundDraftStorage = createDraftStorage();

function normalizeDebounce(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return DEFAULT_DRAFT_DEBOUNCE_MS;
  }
  return Math.round(value);
}

function isCanonicalItemId(value: string): boolean {
  return ITEM_ID_PATTERN.test(value);
}

function isValidCode(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_DRAFT_LENGTH;
}

function isDraftRecord(value: unknown, itemId: string): value is DraftRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 4 &&
    record.version === DRAFT_STORAGE_VERSION &&
    record.itemId === itemId &&
    isValidCode(record.code) &&
    typeof record.updatedAt === "number" &&
    Number.isFinite(record.updatedAt) &&
    record.updatedAt >= 0
  );
}

function safelySync(
  sync: (key: string, value: string | null) => void | Promise<void>,
  key: string,
  value: string | null,
): void {
  try {
    void Promise.resolve(sync(key, value)).catch(() => {});
  } catch {
    // SQLite synchronization is best-effort while the local stack is offline.
  }
}
