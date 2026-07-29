import { afterEach, describe, expect, it, vi } from "vitest";
import { initSqliteSync, resetSqliteLayouts, syncKeyToSqlite } from "../sqliteSync";

describe("sqliteSync client adapter", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
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

  it("handles fetch failure gracefully in initSqliteSync", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network error"));

    await expect(initSqliteSync()).resolves.toBeUndefined();
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
