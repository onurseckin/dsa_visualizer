import { existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "dsa_visualizer.sqlite");

interface DatabaseInstance {
  query: (sql: string) => {
    all: (...params: unknown[]) => unknown[];
    get: (...params: unknown[]) => unknown;
    run: (...params: unknown[]) => void;
  };
  exec: (sql: string) => void;
}

let dbInstance: DatabaseInstance | null = null;

function getDb(): DatabaseInstance {
  if (dbInstance) return dbInstance;

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  try {
    // Attempt using bun:sqlite
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Database } = require("bun:sqlite");
    const db = new Database(DB_PATH, { create: true });
    db.exec(`
      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    dbInstance = {
      query: (sql: string) => {
        const stmt = db.query(sql);
        return {
          all: (...params: unknown[]) => stmt.all(...params),
          get: (...params: unknown[]) => stmt.get(...params),
          run: (...params: unknown[]) => stmt.run(...params),
        };
      },
      exec: (sql: string) => db.exec(sql),
    };
    return dbInstance;
  } catch {
    // Fallback in-memory map persisted to JSON if sqlite bindings fail in node-only sub-processes
    const jsonPath = join(DATA_DIR, "kv_fallback.json");
    let inMemoryStore: Record<string, string> = {};
    if (existsSync(jsonPath)) {
      try {
        const fs = require("fs");
        inMemoryStore = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      } catch {
        inMemoryStore = {};
      }
    }
    const saveFallback = () => {
      try {
        const fs = require("fs");
        fs.writeFileSync(jsonPath, JSON.stringify(inMemoryStore, null, 2), "utf-8");
      } catch {
        // best effort
      }
    };
    dbInstance = {
      query: (sql: string) => ({
        all: () => Object.entries(inMemoryStore).map(([key, value]) => ({ key, value })),
        get: (param?: unknown) => {
          const key = String(param);
          return inMemoryStore[key] ? { key, value: inMemoryStore[key] } : null;
        },
        run: (...params: unknown[]) => {
          if (sql.includes("INSERT INTO kv_store") || sql.includes("REPLACE INTO kv_store")) {
            const key = String(params[0]);
            const val = String(params[1]);
            inMemoryStore[key] = val;
            saveFallback();
          } else if (sql.includes("DELETE FROM kv_store")) {
            const key = String(params[0]);
            delete inMemoryStore[key];
            saveFallback();
          }
        },
      }),
      exec: (sql: string) => {
        if (sql.includes("DELETE FROM kv_store WHERE key LIKE")) {
          const prefix = sql.split("LIKE '")[1]?.split("%'")[0] ?? "";
          Object.keys(inMemoryStore).forEach((k) => {
            if (k.startsWith(prefix)) delete inMemoryStore[k];
          });
          saveFallback();
        }
      },
    };
    return dbInstance;
  }
}

export function getAllState(): Record<string, string> {
  const db = getDb();
  const rows = db.query("SELECT key, value FROM kv_store").all() as {
    key: string;
    value: string;
  }[];
  const state: Record<string, string> = {};
  for (const row of rows) {
    state[row.key] = row.value;
  }
  return state;
}

export function setKeyValue(key: string, value: string): void {
  const db = getDb();
  const now = Date.now();
  db.query("INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)").run(
    key,
    value,
    now,
  );
}

export function removeKeyValue(key: string): void {
  const db = getDb();
  db.query("DELETE FROM kv_store WHERE key = ?").run(key);
}

export function clearKeysByPrefix(prefix: string): void {
  const db = getDb();
  db.exec(`DELETE FROM kv_store WHERE key LIKE '${prefix}%'`);
}
