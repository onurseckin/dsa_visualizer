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
  timer: ReturnType<typeof setTimeout>;
  value: string;
}

interface SyncQueue {
  readonly values: Array<string | null>;
  running: boolean;
}

export function draftStorageKey(itemId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${itemId}`;
}

export function createDraftStorage(options: DraftStorageOptions = {}): DraftStorage {
  const debounceMs = normalizeDebounce(options.debounceMs);
  const now = options.now ?? Date.now;
  const sync = options.sync ?? syncKeyToSqlite;
  const pending = new Map<string, PendingDraft>();
  const syncQueues = new Map<string, SyncQueue>();

  function selectedStorage(): DraftStorageLike | null {
    if (Object.hasOwn(options, "storage")) return options.storage ?? null;
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  }

  function serializedDraft(itemId: string, code: string): string {
    return JSON.stringify({
      version: DRAFT_STORAGE_VERSION,
      itemId,
      code,
      updatedAt: now(),
    } satisfies DraftRecord);
  }

  function persistLocal(itemId: string, value: string): void {
    const key = draftStorageKey(itemId);
    try {
      selectedStorage()?.setItem(key, value);
    } catch {
      // Browser persistence is best-effort in restricted or full storage.
    }
  }

  function enqueueSync(itemId: string, value: string | null): void {
    const key = draftStorageKey(itemId);
    const queue = syncQueues.get(itemId) ?? { running: false, values: [] };
    queue.values.push(value);
    syncQueues.set(itemId, queue);
    if (!queue.running) runNextSync(itemId, key, queue);
  }

  function runNextSync(itemId: string, key: string, queue: SyncQueue): void {
    if (queue.values.length === 0) {
      queue.running = false;
      if (syncQueues.get(itemId) === queue) syncQueues.delete(itemId);
      return;
    }
    queue.running = true;
    const value = queue.values.shift() ?? null;
    let operation: void | Promise<void>;
    try {
      operation = sync(key, value);
    } catch {
      runNextSync(itemId, key, queue);
      return;
    }
    if (!isPromiseLike(operation)) {
      runNextSync(itemId, key, queue);
      return;
    }
    void Promise.resolve(operation).then(
      () => runNextSync(itemId, key, queue),
      () => runNextSync(itemId, key, queue),
    );
  }

  function flushOne(itemId: string): void {
    const record = pending.get(itemId);
    if (!record) return;
    clearTimeout(record.timer);
    pending.delete(itemId);
    enqueueSync(itemId, record.value);
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
      const value = serializedDraft(itemId, code);
      persistLocal(itemId, value);
      const current = pending.get(itemId);
      if (current) clearTimeout(current.timer);
      const timer = setTimeout(() => flushOne(itemId), debounceMs);
      pending.set(itemId, { timer, value });
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
      enqueueSync(itemId, null);
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

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof value === "object" && value !== null && typeof value.then === "function";
}
