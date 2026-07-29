import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DRAFT_STORAGE_VERSION, createDraftStorage, draftStorageKey } from "../draftStorage";

describe("playground draft storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the scaffold when no valid versioned draft exists", () => {
    const drafts = createDraftStorage({ sync: vi.fn() });

    expect(drafts.load("binary-search", "# scaffold")).toBe("# scaffold");

    localStorage.setItem(
      draftStorageKey("binary-search"),
      JSON.stringify({
        version: DRAFT_STORAGE_VERSION + 1,
        itemId: "binary-search",
        code: "# future",
        updatedAt: 1,
      }),
    );
    expect(drafts.load("binary-search", "# scaffold")).toBe("# scaffold");
  });

  it("isolates valid drafts by canonical item ID", async () => {
    const drafts = createDraftStorage({ debounceMs: 25, sync: vi.fn() });

    drafts.scheduleSave("binary-search", "# binary");
    drafts.scheduleSave("merge-sort", "# merge");
    await vi.advanceTimersByTimeAsync(25);

    expect(drafts.load("binary-search", "")).toBe("# binary");
    expect(drafts.load("merge-sort", "")).toBe("# merge");
  });

  it("falls back without deleting corrupt records", () => {
    const key = draftStorageKey("binary-search");
    localStorage.setItem(key, "{broken");
    const drafts = createDraftStorage({ sync: vi.fn() });

    expect(drafts.load("binary-search", "# scaffold")).toBe("# scaffold");
    expect(localStorage.getItem(key)).toBe("{broken");
  });

  it("debounces local and SQLite writes using the latest code", async () => {
    const sync = vi.fn().mockResolvedValue(undefined);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const drafts = createDraftStorage({ debounceMs: 50, sync });

    drafts.scheduleSave("binary-search", "# first");
    drafts.scheduleSave("binary-search", "# latest");
    expect(setItem).not.toHaveBeenCalled();
    expect(sync).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(49);
    expect(setItem).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    const key = draftStorageKey("binary-search");
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem(key) ?? "{}")).toMatchObject({
      version: DRAFT_STORAGE_VERSION,
      itemId: "binary-search",
      code: "# latest",
    });
    expect(sync).toHaveBeenCalledWith(key, localStorage.getItem(key));
  });

  it("flushes pending drafts without clearing them", () => {
    const sync = vi.fn();
    const drafts = createDraftStorage({ debounceMs: 10_000, sync });
    drafts.scheduleSave("binary-search", "# saved");

    drafts.flush("binary-search");

    expect(drafts.load("binary-search", "")).toBe("# saved");
    expect(sync).toHaveBeenCalledOnce();
  });

  it("only Reset removes the selected item's persisted draft", () => {
    const sync = vi.fn();
    const drafts = createDraftStorage({ debounceMs: 1, sync });
    drafts.scheduleSave("binary-search", "# binary");
    drafts.scheduleSave("merge-sort", "# merge");
    drafts.flush();

    drafts.reset("binary-search");

    expect(localStorage.getItem(draftStorageKey("binary-search"))).toBeNull();
    expect(drafts.load("merge-sort", "")).toBe("# merge");
    expect(sync).toHaveBeenLastCalledWith(draftStorageKey("binary-search"), null);
  });

  it("keeps reads and writes best-effort when storage or SQLite fail", async () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error("restricted");
      }),
      setItem: vi.fn(() => {
        throw new Error("full");
      }),
      removeItem: vi.fn(() => {
        throw new Error("restricted");
      }),
    };
    const sync = vi.fn().mockRejectedValue(new Error("offline"));
    const drafts = createDraftStorage({ debounceMs: 1, storage, sync });

    expect(drafts.load("binary-search", "# scaffold")).toBe("# scaffold");
    drafts.scheduleSave("binary-search", "# draft");
    await vi.advanceTimersByTimeAsync(1);
    expect(sync).toHaveBeenCalledOnce();
    expect(() => drafts.reset("binary-search")).not.toThrow();
  });

  it("disposes by flushing pending saves rather than deleting them", () => {
    const drafts = createDraftStorage({ debounceMs: 10_000, sync: vi.fn() });
    drafts.scheduleSave("binary-search", "# keep me");

    drafts.dispose();

    expect(drafts.load("binary-search", "")).toBe("# keep me");
  });
});
