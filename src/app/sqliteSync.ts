/**
 * Client-side adapter syncing localStorage state with local SQLite database via /api/db endpoint.
 */

export async function initSqliteSync(): Promise<void> {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  try {
    const res = await fetch("/api/db/state");
    if (!res.ok) return;
    const data = (await res.json()) as Record<string, string>;
    if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
          try {
            if (window.localStorage.getItem(key) === null) {
              window.localStorage.setItem(key, value);
            }
          } catch {
            // best effort
          }
        }
      }
    }
  } catch {
    // Offline or fallback to local storage
  }
}

export async function syncKeyToSqlite(key: string, value: string | null): Promise<void> {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  try {
    await fetch("/api/db/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch {
    // best effort
  }
}

export async function resetSqliteLayouts(): Promise<void> {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  try {
    await fetch("/api/db/reset", { method: "POST" });
  } catch {
    // best effort
  }
}
