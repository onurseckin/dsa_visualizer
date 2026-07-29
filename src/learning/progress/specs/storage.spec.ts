import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ATTEMPT_STORAGE_VERSION, attemptStorageKey, createAttemptStorage } from "../storage";
import { createAttemptRecord } from "../types";

const record = (overrides: Record<string, unknown> = {}) =>
  createAttemptRecord({
    itemId: "queue-trace",
    mode: "trace",
    variant: "default",
    response: { prediction: "A" },
    gradingStatus: "graded",
    score: 0.9,
    rubric: [{ id: "prediction", score: 0.9, maxScore: 1 }],
    criticalFailures: [],
    confidence: 4,
    misconceptionCodes: [],
    repairedMisconceptionCodes: [],
    isomorphicRetest: false,
    changedContext: false,
    invariantEvidence: "FIFO order is preserved.",
    tradeoffEvidence: "Fairness costs a small scheduling delay.",
    createdAt: 100,
    updatedAt: 100,
    ...overrides,
  });

describe("assessment attempt storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("writes immutable, versioned attempts locally before best-effort SQLite sync", () => {
    const sync = vi.fn();
    const attempts = createAttemptStorage({ sync, now: () => 100 });

    expect(attempts.save(record())).toBe(true);

    expect(attempts.load()).toEqual([record()]);
    expect(Object.isFrozen(attempts.load()[0])).toBe(true);
    expect(JSON.parse(localStorage.getItem(attemptStorageKey()) ?? "{}")).toMatchObject({
      version: ATTEMPT_STORAGE_VERSION,
      attempts: [expect.objectContaining({ itemId: "queue-trace" })],
    });
    expect(sync).toHaveBeenCalledOnce();
  });

  it("ignores corrupt data and queues reset after stale saves so attempts cannot reappear", async () => {
    localStorage.setItem(attemptStorageKey(), "{broken");
    localStorage.setItem("unrelated-preference", "keep");
    const first = deferred();
    const reset = deferred();
    const sync = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => reset.promise);
    const attempts = createAttemptStorage({ sync });
    expect(attempts.load()).toEqual([]);
    expect(localStorage.getItem(attemptStorageKey())).toBe("{broken");
    expect(localStorage.getItem("unrelated-preference")).toBe("keep");

    attempts.save(record());
    attempts.reset({ scope: "item", itemId: "queue-trace" });
    expect(attempts.load()).toEqual([]);
    first.resolve();
    await flushPromises();
    expect(sync.mock.calls[1]).toEqual([attemptStorageKey(), null]);
    reset.resolve();
  });

  it("queues a newest save behind an in-flight save while keeping the local snapshot readable", async () => {
    const firstSave = deferred();
    const newestSave = deferred();
    const sync = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => newestSave.promise);
    const attempts = createAttemptStorage({ sync });

    attempts.save(record({ response: { prediction: "first" } }));
    attempts.save(record({ response: { prediction: "newest" }, createdAt: 101, updatedAt: 101 }));

    expect(attempts.load()).toEqual([
      expect.objectContaining({ response: { prediction: "first" } }),
      expect.objectContaining({ response: { prediction: "newest" } }),
    ]);
    expect(sync).toHaveBeenCalledOnce();
    firstSave.resolve();
    await flushPromises();
    expect(JSON.parse(sync.mock.calls[1]?.[1] ?? "{}")).toMatchObject({
      attempts: [
        expect.objectContaining({ response: { prediction: "first" } }),
        expect.objectContaining({ response: { prediction: "newest" } }),
      ],
    });
    newestSave.resolve();
  });

  it("replaces one pending attempt with its reviewed grade without duplicating history", () => {
    const attempts = createAttemptStorage({ sync: vi.fn() });
    const pending = record({
      gradingStatus: "pending",
      score: 0,
      rubric: [{ id: "prediction", score: 0, maxScore: 1, feedback: "Pending review." }],
    });
    const reviewed = record({
      gradingStatus: "graded",
      score: 1,
      rubric: [{ id: "prediction", score: 1, maxScore: 1, feedback: "Self-review complete." }],
      updatedAt: 150,
    });

    expect(attempts.save(pending)).toBe(true);
    expect(attempts.update(reviewed)).toBe(true);
    expect(attempts.load()).toEqual([reviewed]);
    expect(
      attempts.update(
        record({
          itemId: "missing-attempt",
          createdAt: 200,
          updatedAt: 200,
        }),
      ),
    ).toBe(false);
    expect(attempts.load()).toEqual([reviewed]);
  });

  it("rejects a duplicate implicit attempt identity instead of creating ambiguous history", () => {
    const attempts = createAttemptStorage({ sync: vi.fn() });
    const first = record({ response: { prediction: "first" } });
    const duplicateIdentity = record({ response: { prediction: "duplicate" } });

    expect(attempts.save(first)).toBe(true);
    expect(attempts.save(duplicateIdentity)).toBe(false);
    expect(attempts.load()).toEqual([first]);
  });

  it("serializes save, reset, and a later save so the latest snapshot wins", async () => {
    const firstSave = deferred();
    const reset = deferred();
    const latestSave = deferred();
    const sync = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => reset.promise)
      .mockImplementationOnce(() => latestSave.promise);
    const attempts = createAttemptStorage({ sync });

    attempts.save(record({ response: { prediction: "stale" } }));
    attempts.reset({ scope: "item", itemId: "queue-trace" });
    attempts.save(record({ response: { prediction: "latest" }, createdAt: 101, updatedAt: 101 }));

    expect(attempts.load()).toEqual([
      expect.objectContaining({ response: { prediction: "latest" } }),
    ]);

    firstSave.resolve();
    await flushPromises();
    expect(sync.mock.calls[1]).toEqual([attemptStorageKey(), null]);
    reset.resolve();
    await flushPromises();
    expect(JSON.parse(sync.mock.calls[2]?.[1] ?? "{}")).toMatchObject({
      attempts: [expect.objectContaining({ response: { prediction: "latest" } })],
    });
    latestSave.resolve();
  });

  it("honors a configured 300-attempt bound while loading record 251", () => {
    const attempts = createAttemptStorage({ maxAttempts: 300, sync: vi.fn() });

    for (let index = 0; index < 251; index += 1) {
      attempts.save(record({ createdAt: index + 100, updatedAt: index + 100 }));
    }

    expect(attempts.load()).toHaveLength(251);
  });
});

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
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
