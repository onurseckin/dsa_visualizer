/**
 * Client-side adapter syncing localStorage state with local SQLite database via /api/db endpoint.
 */

const SQLITE_HYDRATION_TIMEOUT_MS = 5_000;

export async function initSqliteSync(): Promise<void> {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  const controller = typeof AbortController === "undefined" ? undefined : new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  try {
    const timeout = new Promise<void>((resolve) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller?.abort();
        resolve();
      }, SQLITE_HYDRATION_TIMEOUT_MS);
    });
    const hydrate = async (): Promise<void> => {
      const res = await fetch(
        "/api/db/state",
        controller ? { signal: controller.signal } : undefined,
      );
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, string>;
      if (!timedOut && data && typeof data === "object") {
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
    };

    await Promise.race([hydrate(), timeout]);
  } catch {
    // Offline or fallback to local storage
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
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
