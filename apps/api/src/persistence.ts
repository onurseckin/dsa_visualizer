import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

/** The small persistence seam used by both Bun production and Vite development. */
export interface KeyValueStore {
  getAll(): Record<string, string>;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearPrefix(prefix: string): void;
  close?(): void;
}

interface DatabaseStatement {
  all(...params: unknown[]): unknown[];
  run(...params: unknown[]): void;
}

interface DatabaseInstance {
  query(sql: string): DatabaseStatement;
  exec(sql: string): void;
  close?(): void;
}

export interface SqliteKeyValueStoreOptions {
  readonly dataDirectory?: string;
  readonly databasePath?: string;
  /** Test-only seam for validating the filesystem fallback on any runtime. */
  readonly forceJsonFallback?: boolean;
}

/**
 * Creates an in-memory store for tests and for environments without Bun SQLite.
 * The fallback deliberately remains best effort: the application also keeps a
 * browser-local copy and must remain usable without this service.
 */
export function createMemoryKeyValueStore(initial: Record<string, string> = {}): KeyValueStore {
  const values = new Map(Object.entries(initial));
  return {
    getAll: () => Object.fromEntries(values),
    set: (key, value) => values.set(key, value),
    delete: (key) => values.delete(key),
    clearPrefix: (prefix) => {
      for (const key of values.keys()) {
        if (key.startsWith(prefix)) values.delete(key);
      }
    },
  };
}

/**
 * Opens SQLite when Bun provides it; otherwise a JSON-backed store preserves
 * the existing Vite development fallback semantics.
 */
export function createSqliteKeyValueStore(options: SqliteKeyValueStoreOptions = {}): KeyValueStore {
  const databasePath =
    options.databasePath ??
    join(options.dataDirectory ?? join(process.cwd(), "data"), "dsa_visualizer.sqlite");
  const storageDirectory = dirname(databasePath);
  mkdirSync(storageDirectory, { recursive: true });
  const fallbackPath = join(storageDirectory, "kv_fallback.json");

  try {
    if (options.forceJsonFallback) return createJsonFileKeyValueStore(fallbackPath);
    const Database = loadBunDatabase();
    if (!Database) return createJsonFileKeyValueStore(fallbackPath);

    const database = new Database(databasePath, { create: true }) as DatabaseInstance;
    database.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    return sqliteStore(database);
  } catch {
    return createJsonFileKeyValueStore(fallbackPath);
  }
}

export function serializeStateValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value;
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? undefined : serialized;
  } catch {
    return undefined;
  }
}

function sqliteStore(database: DatabaseInstance): KeyValueStore {
  return {
    getAll: () => {
      const rows = database.query("SELECT key, value FROM kv_store").all() as {
        key: string;
        value: string;
      }[];
      return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
    },
    set: (key, value) => {
      database
        .query("INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)")
        .run(key, value, Date.now());
    },
    delete: (key) => database.query("DELETE FROM kv_store WHERE key = ?").run(key),
    clearPrefix: (prefix) =>
      database.query("DELETE FROM kv_store WHERE substr(key, 1, ?) = ?").run(prefix.length, prefix),
    close: () => database.close?.(),
  };
}

function createJsonFileKeyValueStore(jsonPath: string): KeyValueStore {
  let values: Record<string, string> = {};
  if (existsSync(jsonPath)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(jsonPath, "utf8"));
      if (isStringRecord(parsed)) values = parsed;
    } catch {
      values = {};
    }
  }

  const persist = () => {
    try {
      writeFileSync(jsonPath, JSON.stringify(values, null, 2), "utf8");
    } catch {
      // The UI intentionally treats persistence as best effort.
    }
  };

  return {
    getAll: () => ({ ...values }),
    set: (key, value) => {
      values[key] = value;
      persist();
    },
    delete: (key) => {
      delete values[key];
      persist();
    },
    clearPrefix: (prefix) => {
      for (const key of Object.keys(values)) {
        if (key.startsWith(prefix)) delete values[key];
      }
      persist();
    },
  };
}

function loadBunDatabase():
  | (new (path: string, options: { create: boolean }) => DatabaseInstance)
  | undefined {
  try {
    return createRequire(import.meta.url)("bun:sqlite").Database as new (
      path: string,
      options: { create: boolean },
    ) => DatabaseInstance;
  } catch {
    return undefined;
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}
