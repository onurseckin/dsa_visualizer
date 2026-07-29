import { afterEach, describe, expect, it, vi } from "vitest";
import { initSqliteSync, resetSqliteLayouts, syncKeyToSqlite } from "../sqliteSync";

describe("sqliteSync client adapter", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("fetches /api/db/state and hydrates localStorage on initSqliteSync", async () => {
    const fakeState = { k1: "v1", k2: "v2" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => fakeState,
    } as Response);

    await initSqliteSync();

    expect(localStorage.getItem("k1")).toBe("v1");
    expect(localStorage.getItem("k2")).toBe("v2");
  });

  it("does not overwrite newer browser state with a stale SQLite snapshot", async () => {
    localStorage.setItem("draft", "newer-local-value");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ draft: "stale-server-value", serverOnly: "hydrated" }),
    } as Response);

    await initSqliteSync();

    expect(localStorage.getItem("draft")).toBe("newer-local-value");
    expect(localStorage.getItem("serverOnly")).toBe("hydrated");
  });

  it("preserves a local value written while the SQLite snapshot is in flight", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      }),
    );

    const hydration = initSqliteSync();
    localStorage.setItem("draft", "newer-local-value");
    resolveResponse?.({
      ok: true,
      json: async () => ({ draft: "stale-server-value" }),
    } as Response);

    await hydration;

    expect(localStorage.getItem("draft")).toBe("newer-local-value");
  });

  it("handles fetch failure gracefully in initSqliteSync", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network error"));

    await expect(initSqliteSync()).resolves.toBeUndefined();
  });

  it("stops waiting for a SQLite snapshot that never settles", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(new Promise<Response>(() => undefined));

    let complete = false;
    void initSqliteSync().then(() => {
      complete = true;
    });

    await vi.advanceTimersByTimeAsync(5_000);

    expect(complete).toBe(true);
  });

  it("times out a stalled response body and ignores its late snapshot", async () => {
    vi.useFakeTimers();
    let resolveBody: ((value: Record<string, string>) => void) | undefined;
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: () =>
        new Promise<Record<string, string>>((resolve) => {
          resolveBody = resolve;
        }),
    } as Response);

    let complete = false;
    const hydration = initSqliteSync().then(() => {
      complete = true;
    });
    await vi.advanceTimersByTimeAsync(5_000);

    expect(complete).toBe(true);
    resolveBody?.({ late: "snapshot" });
    await hydration;
    await Promise.resolve();
    expect(localStorage.getItem("late")).toBeNull();
  });

  it("sends POST request to /api/db/state on syncKeyToSqlite", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
    } as Response);

    await syncKeyToSqlite("my_key", "my_val");

    expect(fetchSpy).toHaveBeenCalledWith("/api/db/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "my_key", value: "my_val" }),
    });
  });

  it("sends POST request to /api/db/reset on resetSqliteLayouts", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
    } as Response);

    await resetSqliteLayouts();

    expect(fetchSpy).toHaveBeenCalledWith("/api/db/reset", { method: "POST" });
  });
});
