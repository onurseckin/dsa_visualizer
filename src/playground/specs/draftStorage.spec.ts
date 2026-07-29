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

  it("persists the local snapshot immediately and debounces only SQLite using latest code", async () => {
    const sync = vi.fn().mockResolvedValue(undefined);
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const drafts = createDraftStorage({ debounceMs: 50, sync });

    drafts.scheduleSave("binary-search", "# first");
    expect(drafts.load("binary-search", "")).toBe("# first");
    drafts.scheduleSave("binary-search", "# latest");
    expect(drafts.load("binary-search", "")).toBe("# latest");
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(sync).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(49);
    expect(sync).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    const key = draftStorageKey("binary-search");
    expect(JSON.parse(localStorage.getItem(key) ?? "{}")).toMatchObject({
      version: DRAFT_STORAGE_VERSION,
      itemId: "binary-search",
      code: "# latest",
    });
    expect(sync).toHaveBeenCalledWith(key, localStorage.getItem(key));
  });

  it("survives an immediate reload before the SQLite debounce expires", () => {
    const drafts = createDraftStorage({ debounceMs: 400, sync: vi.fn() });
    drafts.scheduleSave("binary-search", "# unsynced local edit");

    const reloaded = createDraftStorage({ sync: vi.fn() });

    expect(reloaded.load("binary-search", "# scaffold")).toBe("# unsynced local edit");
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

  it("serializes delayed SQLite saves so an older save cannot finish after a newer save", async () => {
    const first = deferred();
    const second = deferred();
    const sync = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const drafts = createDraftStorage({ debounceMs: 1, sync });

    drafts.scheduleSave("binary-search", "# first");
    await vi.advanceTimersByTimeAsync(1);
    expect(sync).toHaveBeenCalledTimes(1);

    drafts.scheduleSave("binary-search", "# newest");
    await vi.advanceTimersByTimeAsync(1);
    expect(sync).toHaveBeenCalledTimes(1);

    first.resolve();
    await flushPromises();
    expect(sync).toHaveBeenCalledTimes(2);
    expect(JSON.parse(sync.mock.calls[1][1] ?? "{}")).toMatchObject({ code: "# newest" });
    second.resolve();
  });

  it("queues Reset behind an in-flight save so stale data cannot resurrect", async () => {
    const save = deferred();
    const reset = deferred();
    const sync = vi
      .fn()
      .mockImplementationOnce(() => save.promise)
      .mockImplementationOnce(() => reset.promise);
    const drafts = createDraftStorage({ debounceMs: 1, sync });

    drafts.scheduleSave("binary-search", "# stale");
    await vi.advanceTimersByTimeAsync(1);
    drafts.reset("binary-search");

    expect(localStorage.getItem(draftStorageKey("binary-search"))).toBeNull();
    expect(sync).toHaveBeenCalledTimes(1);

    save.resolve();
    await flushPromises();
    expect(sync).toHaveBeenCalledTimes(2);
    expect(sync.mock.calls[1]).toEqual([draftStorageKey("binary-search"), null]);
    reset.resolve();
  });
});

function deferred(): {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
} {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
