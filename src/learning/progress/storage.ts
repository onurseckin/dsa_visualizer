import { syncKeyToSqlite } from "../../app/sqliteSync";
import {
  createAttemptRecord,
  isAssessmentAttemptRecord,
  type AssessmentAttemptRecord,
} from "./types";

export const ATTEMPT_STORAGE_VERSION = 2;
export const ATTEMPT_STORAGE_KEY = "dsa_visualizer_learning_attempts";
export const DEFAULT_MAX_ATTEMPTS = 250;

export interface AttemptStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type AttemptResetScope =
  | { readonly scope: "item"; readonly itemId: string }
  | { readonly scope: "target"; readonly itemIds: readonly [string, ...string[]] }
  | { readonly scope: "all" };

export interface AttemptStorage {
  load(): readonly AssessmentAttemptRecord[];
  save(record: AssessmentAttemptRecord): boolean;
  reset(scope: AttemptResetScope): void;
}

export interface AttemptStorageOptions {
  readonly storage?: AttemptStorageLike | null;
  readonly sync?: (key: string, value: string | null) => void | Promise<void>;
  readonly maxAttempts?: number;
  readonly now?: () => number;
}

interface StoredAttempts {
  readonly version: typeof ATTEMPT_STORAGE_VERSION;
  readonly attempts: readonly AssessmentAttemptRecord[];
}

interface SyncQueue {
  values: Array<string | null>;
  running: boolean;
}

export function attemptStorageKey(): string {
  return ATTEMPT_STORAGE_KEY;
}

export function createAttemptStorage(options: AttemptStorageOptions = {}): AttemptStorage {
  const maxAttempts = normalizeMaxAttempts(options.maxAttempts);
  const sync = options.sync ?? syncKeyToSqlite;
  const queue: SyncQueue = { values: [], running: false };
  void options.now;

  const selectedStorage = (): AttemptStorageLike | null => {
    if (Object.hasOwn(options, "storage")) return options.storage ?? null;
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  };

  const load = (): readonly AssessmentAttemptRecord[] => {
    let raw: string | null;
    try {
      raw = selectedStorage()?.getItem(attemptStorageKey()) ?? null;
    } catch {
      return [];
    }
    if (raw === null) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredAttempts(parsed, maxAttempts)) return [];
      return parsed.attempts.map(createSnapshot);
    } catch {
      return [];
    }
  };

  const write = (attempts: readonly AssessmentAttemptRecord[]): boolean => {
    const value = JSON.stringify({
      version: ATTEMPT_STORAGE_VERSION,
      attempts,
    } satisfies StoredAttempts);
    let persisted = false;
    try {
      const storage = selectedStorage();
      if (storage) {
        storage.setItem(attemptStorageKey(), value);
        persisted = true;
      }
    } catch {
      // Browser persistence remains immediate but best-effort.
    }
    enqueue(value);
    return persisted;
  };

  const enqueue = (value: string | null): void => {
    queue.values.push(value);
    if (!queue.running) runNext();
  };

  const runNext = (): void => {
    const value = queue.values.shift();
    if (value === undefined && queue.values.length === 0) {
      queue.running = false;
      return;
    }
    queue.running = true;
    let operation: void | Promise<void>;
    try {
      operation = sync(attemptStorageKey(), value ?? null);
    } catch {
      runNext();
      return;
    }
    if (!isPromiseLike(operation)) {
      runNext();
      return;
    }
    void Promise.resolve(operation).then(runNext, runNext);
  };

  return {
    load,
    save(record) {
      if (!isAssessmentAttemptRecord(record)) return false;
      const attempts = [...load(), createSnapshot(record)].slice(-maxAttempts);
      return write(attempts);
    },
    reset(scope) {
      const current = load();
      if (scope.scope === "all") {
        try {
          selectedStorage()?.removeItem(attemptStorageKey());
        } catch {
          // Reset is restricted to this progress key and remains best-effort.
        }
        enqueue(null);
        return;
      }
      const selectedIds = scope.scope === "item" ? [scope.itemId] : [...scope.itemIds];
      if (!selectedIds.every(isCanonicalItemId)) return;
      const selected = new Set(selectedIds);
      const remaining = current.filter((attempt) => !selected.has(attempt.itemId));
      if (remaining.length === 0) {
        try {
          selectedStorage()?.removeItem(attemptStorageKey());
        } catch {
          // Reset is restricted to this progress key and remains best-effort.
        }
        enqueue(null);
        return;
      }
      write(remaining);
    },
  };
}

export const assessmentAttemptStorage = createAttemptStorage();

function isStoredAttempts(value: unknown, maxAttempts: number): value is StoredAttempts {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 2 &&
    record.version === ATTEMPT_STORAGE_VERSION &&
    Array.isArray(record.attempts) &&
    record.attempts.length <= maxAttempts &&
    record.attempts.every(isAssessmentAttemptRecord)
  );
}

function createSnapshot(record: AssessmentAttemptRecord): AssessmentAttemptRecord {
  const { version: _version, ...input } = record;
  return createAttemptRecord(input);
}

function normalizeMaxAttempts(value: number | undefined): number {
  if (!Number.isInteger(value) || value === undefined || value < 1 || value > 1_000) {
    return DEFAULT_MAX_ATTEMPTS;
  }
  return value;
}

function isCanonicalItemId(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof value === "object" && value !== null && typeof value.then === "function";
}
