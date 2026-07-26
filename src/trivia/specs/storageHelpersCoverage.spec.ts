import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TRIVIA_CONFIG_KEY,
  TRIVIA_PROGRESS_KEY,
  TRIVIA_STORAGE_VERSION,
  clampLevel,
  cloneTriviaConfig,
  cloneTriviaProgress,
  getStorage,
  isBlankCount,
  isMode,
  isRecord,
  isTally,
  readDeck,
  readLineNumbers,
  readVersioned,
  writeVersioned,
} from "../storage/storageHelpers";
import {
  readDrilled,
  readStats,
  writeTriviaProgress,
  clearTrivia,
} from "../storage/progressStorage";
import { writeTriviaConfig } from "../storage/configStorage";
import { gradeRound } from "../engine/triviaEngineGrading";
import { buildTiles } from "../engine/triviaEngineRound";
import { parsePuzzleLines, blankableLines } from "../engine/triviaEngineParser";
import {
  TRIVIA_SESSIONS_KEY,
  createSession,
  deleteSession,
  generateNextSessionName,
  loadTriviaBootstrap,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
  writeTriviaSessions,
} from "../triviaSessions";
import {
  TRIVIA_LAYOUT_KEY,
  TRIVIA_LAYOUT_RESET_EVENT,
  clampPanelHeight,
  clampSplitPercent,
  clearTriviaLayout,
  readTriviaLayout,
  resetTriviaLayout,
  writeTriviaLayout,
} from "../triviaLayout";
import { DEFAULT_TRIVIA_CONFIG } from "../triviaEngine";
import type { TriviaProgress, TriviaSessionRecord } from "../../types/trivia";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("storageHelpers coverage", () => {
  it("cloneTriviaConfig creates a distinct copy of deck array", () => {
    const config = { ...DEFAULT_TRIVIA_CONFIG, deck: ["a", "b"] };
    const cloned = cloneTriviaConfig(config);
    expect(cloned).toEqual(config);
    expect(cloned.deck).not.toBe(config.deck);
  });

  it("cloneTriviaProgress creates deep copies of drilled and stats maps", () => {
    const progress: TriviaProgress = {
      level: 2,
      drilled: { "alg-1": { "2": [1, 2] } },
      stats: { "alg-1": { "1": { attempts: 5, misses: 1 } } },
      completed: false,
      roundsPlayed: 10,
    };
    const cloned = cloneTriviaProgress(progress);
    expect(cloned).toEqual(progress);
    expect(cloned.drilled["alg-1"]).not.toBe(progress.drilled["alg-1"]);
    expect(cloned.drilled["alg-1"]["2"]).not.toBe(progress.drilled["alg-1"]["2"]);
    expect(cloned.stats["alg-1"]).not.toBe(progress.stats["alg-1"]);
  });

  it("isRecord correctly distinguishes plain objects", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(123)).toBe(false);
    expect(isRecord("test")).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("isMode validates trivia modes", () => {
    expect(isMode("choice")).toBe(true);
    expect(isMode("type")).toBe(true);
    expect(isMode("invalid")).toBe(false);
  });

  it("isBlankCount checks bounds and integer property", () => {
    expect(isBlankCount(1)).toBe(true);
    expect(isBlankCount(5)).toBe(true);
    expect(isBlankCount(10)).toBe(true);
    expect(isBlankCount(0)).toBe(false);
    expect(isBlankCount(1.5)).toBe(false);
    expect(isBlankCount("2")).toBe(false);
  });

  it("isTally checks non-negative integers", () => {
    expect(isTally(0)).toBe(true);
    expect(isTally(100)).toBe(true);
    expect(isTally(-1)).toBe(false);
    expect(isTally(2.5)).toBe(false);
    expect(isTally("0")).toBe(false);
  });

  it("clampLevel handles non-finite and extreme values", () => {
    expect(clampLevel(Number.NaN)).toBe(1);
    expect(clampLevel(Number.POSITIVE_INFINITY)).toBe(1);
    expect(clampLevel(Number.NEGATIVE_INFINITY)).toBe(1);
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(3.7)).toBe(4);
    expect(clampLevel(150)).toBe(100);
  });

  it("readDeck handles non-arrays, invalid entries, and deduping", () => {
    expect(readDeck(null)).toBeNull();
    expect(readDeck(123)).toBeNull();
    expect(readDeck(["a", "", "b"])).toBeNull();
    expect(readDeck(["a", 123])).toBeNull();
    expect(readDeck(["a", "b", "a"])).toEqual(["a", "b"]);
  });

  it("readLineNumbers validates and sorts line numbers", () => {
    expect(readLineNumbers(null)).toBeNull();
    expect(readLineNumbers([1, "2"])).toBeNull();
    expect(readLineNumbers([1, 1.5])).toBeNull();
    expect(readLineNumbers([0, 1])).toBeNull();
    expect(readLineNumbers([5, 2, 5, 1])).toEqual([1, 2, 5]);
  });

  it("getStorage handles error when accessing window.localStorage", () => {
    const originalGetter = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Access denied");
      },
      configurable: true,
    });

    expect(getStorage()).toBeNull();

    if (originalGetter) {
      Object.defineProperty(window, "localStorage", originalGetter);
    }
  });

  it("readVersioned and writeVersioned error handling", () => {
    expect(readVersioned("non_existent")).toBeNull();

    window.localStorage.setItem("invalid_json", "{bad");
    expect(readVersioned("invalid_json")).toBeNull();

    window.localStorage.setItem("wrong_version", JSON.stringify({ version: 999 }));
    expect(readVersioned("wrong_version")).toBeNull();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Read error");
    });
    expect(readVersioned("some_key")).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Write error");
    });
    expect(() => writeVersioned("some_key", { a: 1 })).not.toThrow();
  });
});

describe("progressStorage helper functions coverage", () => {
  it("readDrilled validates drilled map structures", () => {
    expect(readDrilled(null)).toBeNull();
    expect(readDrilled("not object")).toBeNull();
    expect(readDrilled({ "alg-1": "not object" })).toBeNull();
    expect(readDrilled({ "alg-1": { invalidLevel: [1] } })).toBeNull();
    expect(readDrilled({ "alg-1": { "2": ["not a line"] } })).toBeNull();
    expect(readDrilled({ "alg-1": { "2": [1, 2] } })).toEqual({ "alg-1": { "2": [1, 2] } });
  });

  it("readStats validates stats map structures", () => {
    expect(readStats(null)).toBeNull();
    expect(readStats({ "alg-1": "not object" })).toBeNull();
    expect(readStats({ "alg-1": { invalidLine: { attempts: 1, misses: 0 } } })).toBeNull();
    expect(readStats({ "alg-1": { "1": "not object" } })).toBeNull();
    expect(readStats({ "alg-1": { "1": { attempts: -1, misses: 0 } } })).toBeNull();
    expect(readStats({ "alg-1": { "1": { attempts: 1, misses: 2 } } })).toBeNull();
    expect(readStats({ "alg-1": { "1": { attempts: 5, misses: 2 } } })).toEqual({
      "alg-1": { "1": { attempts: 5, misses: 2 } },
    });
  });

  it("writeTriviaProgress handles invalid roundsPlayed fallback", () => {
    const invalidProgress: TriviaProgress = {
      level: 1,
      drilled: {},
      stats: {},
      completed: false,
      roundsPlayed: -5,
    };
    const saved = writeTriviaProgress(invalidProgress);
    expect(saved.roundsPlayed).toBe(0);
  });

  it("clearTrivia does not throw when storage is null or throws", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Remove error");
    });
    expect(() => clearTrivia()).not.toThrow();
  });
});

describe("triviaEngineParser coverage", () => {
  it("parsePuzzleLines handles indented lines and empty code", () => {
    const lines = parsePuzzleLines("  code line 1\n\n  code line 2", { skipLines: [1] });
    expect(lines).toHaveLength(3);
    expect(lines[0].blankable).toBe(false); // skipped
    expect(lines[1].blankable).toBe(false); // empty line
    expect(lines[2].blankable).toBe(true);
    expect(blankableLines(lines)).toEqual([3]);
  });
});

describe("triviaSessions coverage", () => {
  it("generateNextSessionName calculates next index from existing session names", () => {
    const sessions: TriviaSessionRecord[] = [
      {
        id: "s1",
        name: "Session 3",
        createdAt: 0,
        updatedAt: 0,
        config: DEFAULT_TRIVIA_CONFIG,
        progress: { level: 1, drilled: {}, stats: {}, completed: false, roundsPlayed: 0 },
        lastScreen: "setup",
      },
      {
        id: "s2",
        name: "Trivia 7",
        createdAt: 0,
        updatedAt: 0,
        config: DEFAULT_TRIVIA_CONFIG,
        progress: { level: 1, drilled: {}, stats: {}, completed: false, roundsPlayed: 0 },
        lastScreen: "setup",
      },
      {
        id: "s3",
        name: "Custom Name",
        createdAt: 0,
        updatedAt: 0,
        config: DEFAULT_TRIVIA_CONFIG,
        progress: { level: 1, drilled: {}, stats: {}, completed: false, roundsPlayed: 0 },
        lastScreen: "setup",
      },
    ];
    expect(generateNextSessionName(sessions)).toBe("Session 8");
  });

  it("readTriviaSessions filters invalid JSON or malformed sessions", () => {
    window.localStorage.setItem(TRIVIA_SESSIONS_KEY, "invalid json");
    expect(readTriviaSessions()).toEqual([]);

    window.localStorage.setItem(
      TRIVIA_SESSIONS_KEY,
      JSON.stringify([
        {
          id: "1",
          name: "Valid",
          createdAt: 1,
          updatedAt: 1,
          config: {},
          progress: {},
          lastScreen: "setup",
        },
        { id: 2, name: "Invalid ID" },
        "string item",
        null,
      ]),
    );
    expect(readTriviaSessions()).toHaveLength(1);
  });

  it("writeTriviaSessions handles storage error", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Write failed");
    });
    expect(() => writeTriviaSessions([])).not.toThrow();
  });

  it("readActiveSessionId & writeActiveSessionId handle storage errors and null", () => {
    writeActiveSessionId("session_123");
    expect(readActiveSessionId()).toBe("session_123");
    writeActiveSessionId(null);
    expect(readActiveSessionId()).toBeNull();

    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Get failed");
    });
    expect(readActiveSessionId()).toBeNull();

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Remove failed");
    });
    expect(() => writeActiveSessionId(null)).not.toThrow();
  });

  it("createSession, updateSession, deleteSession behavior", () => {
    const s1 = createSession("  Custom Session  ");
    expect(s1.name).toBe("Custom Session");
    expect(readActiveSessionId()).toBe(s1.id);

    const updated = updateSession(s1.id, { name: "Renamed Session" });
    expect(updated?.name).toBe("Renamed Session");

    expect(updateSession("non_existent", { name: "New" })).toBeNull();

    deleteSession(s1.id);
    expect(readTriviaSessions().find((s) => s.id === s1.id)).toBeUndefined();
  });

  it("loadTriviaBootstrap logic for active session selection and legacy data", () => {
    // 1. Existing sessions
    const s = createSession("Existing");
    writeActiveSessionId(s.id);
    let boot = loadTriviaBootstrap();
    expect(boot.activeId).toBe(s.id);

    // Stale active ID
    writeActiveSessionId("non_existent_id");
    boot = loadTriviaBootstrap();
    expect(boot.activeId).toBeNull();

    // 2. Clean storage -> creates default session
    window.localStorage.clear();
    boot = loadTriviaBootstrap();
    expect(boot.sessions).toHaveLength(1);
    expect(boot.activeId).toBe(boot.sessions[0].id);

    // 3. Legacy data migration
    window.localStorage.clear();
    window.localStorage.setItem(
      TRIVIA_CONFIG_KEY,
      JSON.stringify({
        version: TRIVIA_STORAGE_VERSION,
        deck: ["two-sum"],
        mode: "choice",
        minBlanks: 1,
        maxBlanks: 3,
        includeDistractors: true,
      }),
    );
    window.localStorage.setItem(
      TRIVIA_PROGRESS_KEY,
      JSON.stringify({
        version: TRIVIA_STORAGE_VERSION,
        level: 2,
        drilled: {},
        stats: {},
        completed: false,
        roundsPlayed: 5,
      }),
    );
    boot = loadTriviaBootstrap();
    expect(boot.sessions).toHaveLength(1);
    expect(boot.sessions[0].config.deck).toEqual(["two-sum"]);
    expect(boot.sessions[0].progress.roundsPlayed).toBe(5);
    expect(boot.activeId).toBeNull();
  });
});

describe("triviaLayout coverage", () => {
  it("clampSplitPercent and clampPanelHeight handle edge values", () => {
    expect(clampSplitPercent(Number.NaN)).toBe(65);
    expect(clampSplitPercent(10)).toBe(40);
    expect(clampSplitPercent(99)).toBe(85);

    expect(clampPanelHeight(null)).toBeNull();
    expect(clampPanelHeight(Number.NaN)).toBeNull();
    expect(clampPanelHeight(20)).toBe(64);
    expect(clampPanelHeight(3000)).toBe(2000);
    expect(clampPanelHeight(200)).toBe(200);
  });

  it("readTriviaLayout & writeTriviaLayout handle corrupted values and errors", () => {
    window.localStorage.setItem(TRIVIA_LAYOUT_KEY, "invalid json");
    expect(readTriviaLayout().version).toBe(2);

    window.localStorage.setItem(TRIVIA_LAYOUT_KEY, JSON.stringify({ version: 999 }));
    expect(readTriviaLayout().version).toBe(2);

    window.localStorage.setItem(
      TRIVIA_LAYOUT_KEY,
      JSON.stringify({
        version: 2,
        puzzleSplitPercent: 65,
        panelHeights: { sessionList: "invalid" },
        problemExpanded: true,
      }),
    );
    expect(readTriviaLayout().version).toBe(2);

    const written = writeTriviaLayout({ puzzleSplitPercent: 50 });
    expect(written.puzzleSplitPercent).toBe(50);

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Write layout failed");
    });
    expect(() => writeTriviaLayout({ puzzleSplitPercent: 55 })).not.toThrow();

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Remove layout failed");
    });
    expect(() => clearTriviaLayout()).not.toThrow();
  });

  it("resetTriviaLayout dispatches window reset event", () => {
    let eventFired = false;
    const listener = () => {
      eventFired = true;
    };
    window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);
    resetTriviaLayout();
    expect(eventFired).toBe(true);
    window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, listener);
  });
});

describe("additional branch coverage for storage, engine, parser and layout", () => {
  it("writeTriviaConfig handles invalid deck patch fallback", () => {
    writeTriviaConfig({ deck: ["bubble-sort"] });
    const invalidDeckPatch = { deck: [""] }; // readDeck returns null
    const result = writeTriviaConfig(invalidDeckPatch);
    expect(result.deck).toEqual(["bubble-sort"]);
  });

  it("gradeRound and buildTiles handle blanks referencing non-existent line numbers", () => {
    const round = {
      algorithmId: "test-alg",
      level: 1,
      lines: [{ number: 1, text: "a = 1", indent: "", content: "a = 1", blankable: true }],
      blanks: [99], // line 99 doesn't exist in round.lines
      tiles: [],
    };
    const grade = gradeRound(round, { 99: "" });
    expect(grade.perBlank[99]).toBe(true); // empty answer matches empty fallback

    const rng = (_min?: number, _max?: number) => 0.5;
    const tiles = buildTiles(round.lines, [99], undefined, rng);
    expect(tiles).toHaveLength(2); // 1 answer + 1 decoy
    expect(tiles.find((t) => t.id === "answer-99")?.text).toBe("");
  });

  it("parsePuzzleLines handles null regex match gracefully if exec returns null", () => {
    const spy = vi.spyOn(RegExp.prototype, "exec").mockReturnValueOnce(null);
    const lines = parsePuzzleLines("single line");
    expect(lines[0].text).toBe("single line");
    expect(lines[0].indent).toBe("");
    expect(lines[0].content).toBe("single line");
    spy.mockRestore();
  });

  it("readVersioned, writeVersioned, clearTrivia, triviaLayout, triviaSessions when getStorage is null or window undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(getStorage()).toBeNull();

    expect(readVersioned("key")).toBeNull();
    expect(() => writeVersioned("key", { a: 1 })).not.toThrow();
    expect(() => clearTrivia()).not.toThrow();
    expect(readTriviaLayout().version).toBe(2);
    expect(writeTriviaLayout({})).toBeDefined();
    expect(() => clearTriviaLayout()).not.toThrow();
    expect(readTriviaSessions()).toEqual([]);
    expect(() => writeTriviaSessions([])).not.toThrow();
    expect(readActiveSessionId()).toBeNull();
    expect(() => writeActiveSessionId("test")).not.toThrow();

    vi.unstubAllGlobals();

    const originalGetter = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Access denied");
      },
      configurable: true,
    });

    expect(readVersioned("key")).toBeNull();
    expect(readTriviaLayout().version).toBe(2);
    expect(writeTriviaLayout({})).toBeDefined();
    expect(clearTriviaLayout()).toBeUndefined();
    expect(readTriviaSessions()).toEqual([]);
    expect(writeTriviaSessions([])).toBeUndefined();
    expect(readActiveSessionId()).toBeNull();
    expect(writeActiveSessionId("x")).toBeUndefined();

    if (originalGetter) {
      Object.defineProperty(window, "localStorage", originalGetter);
    }
  });

  it("readVersioned returns null when parsed value is a primitive JSON e.g. number or string", () => {
    window.localStorage.setItem("number_key", JSON.stringify(123));
    expect(readVersioned("number_key")).toBeNull();

    window.localStorage.setItem("string_key", JSON.stringify("hello"));
    expect(readVersioned("string_key")).toBeNull();
  });

  it("writeTriviaLayout handles partial panelHeights, puzzleSplitPercent and problemExpanded patches", () => {
    const l1 = writeTriviaLayout({
      panelHeights: { sessionList: null, settings: 250 },
      puzzleSplitPercent: 50,
      problemExpanded: false,
    });

    expect(l1.panelHeights.sessionList).toBeNull();
    expect(l1.panelHeights.settings).toBe(250);
    expect(l1.puzzleSplitPercent).toBe(50);
    expect(l1.problemExpanded).toBe(false);

    // Unchanged keys remain untouched when omitted in patch
    const l2 = writeTriviaLayout({
      panelHeights: { settings: undefined },
    });
    expect(l2.panelHeights.settings).toBe(250);
    expect(l2.problemExpanded).toBe(false);
  });

  it("deleteSession reassigns active session to remaining session or null", () => {
    const s1 = createSession("Session 1");
    const s2 = createSession("Session 2");

    writeActiveSessionId(s2.id);
    deleteSession(s2.id);
    expect(readActiveSessionId()).toBe(s1.id);

    deleteSession(s1.id);
    expect(readActiveSessionId()).toBeNull();
  });

  it("loadTriviaBootstrap migrates legacy progress with drilled entries when deck is empty", () => {
    window.localStorage.clear();
    window.localStorage.setItem(
      TRIVIA_PROGRESS_KEY,
      JSON.stringify({
        version: TRIVIA_STORAGE_VERSION,
        level: 2,
        drilled: { "bubble-sort": { "1": [1, 2] } },
        stats: {},
        completed: false,
        roundsPlayed: 0,
      }),
    );

    const boot = loadTriviaBootstrap();
    expect(boot.sessions).toHaveLength(1);
    expect(boot.sessions[0].progress.drilled).toEqual({ "bubble-sort": { "1": [1, 2] } });
    expect(boot.activeId).toBeNull();
  });
});
