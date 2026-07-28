import { afterEach, describe, expect, it, vi } from "vitest";
import { cloneTriviaConfig, cloneTriviaProgress } from "../triviaCloning";
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
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});

describe("trivia supporting modules", () => {
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

  it("loadTriviaBootstrap selects valid sessions and creates a clean default when empty", () => {
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
  });
});

describe("triviaLayout coverage", () => {
  it("clampSplitPercent and clampPanelHeight handle edge values", () => {
    expect(clampSplitPercent(Number.NaN)).toBe(35);
    expect(clampSplitPercent(10)).toBe(20);
    expect(clampSplitPercent(99)).toBe(80);

    expect(clampPanelHeight(null)).toBeNull();
    expect(clampPanelHeight(Number.NaN)).toBeNull();
    expect(clampPanelHeight(20)).toBe(64);
    expect(clampPanelHeight(3000)).toBe(2000);
    expect(clampPanelHeight(200)).toBe(200);
  });

  it("readTriviaLayout & writeTriviaLayout handle corrupted values and errors", () => {
    window.localStorage.setItem(TRIVIA_LAYOUT_KEY, "invalid json");
    expect(readTriviaLayout().version).toBe(6);

    window.localStorage.setItem(TRIVIA_LAYOUT_KEY, JSON.stringify({ version: 999 }));
    expect(readTriviaLayout().version).toBe(6);

    window.localStorage.setItem(
      TRIVIA_LAYOUT_KEY,
      JSON.stringify({
        version: 4,
        puzzleSplitPercent: 55,
        panelHeights: {
          sessionList: null,
          deckBuilder: 200,
          settings: null,
          problem: 140,
          puzzle: null,
          tiles: null,
        },
        problemExpanded: true,
      }),
    );
    expect(readTriviaLayout().version).toBe(6);

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

  it("handles unavailable window and localStorage in current layout and session persistence", () => {
    vi.stubGlobal("window", undefined);

    expect(readTriviaLayout().version).toBe(6);
    expect(writeTriviaLayout({})).toBeDefined();
    expect(() => clearTriviaLayout()).not.toThrow();
    expect(readTriviaSessions()).toEqual([]);
    expect(() => writeTriviaSessions([])).not.toThrow();
    expect(readActiveSessionId()).toBeNull();
    expect(() => writeActiveSessionId("test")).not.toThrow();

    vi.unstubAllGlobals();

    const originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    try {
      Object.defineProperty(window, "localStorage", {
        get: () => {
          throw new Error("Access denied");
        },
        configurable: true,
      });

      expect(readTriviaLayout().version).toBe(6);
      expect(writeTriviaLayout({})).toBeDefined();
      expect(clearTriviaLayout()).toBeUndefined();
      expect(readTriviaSessions()).toEqual([]);
      expect(writeTriviaSessions([])).toBeUndefined();
      expect(readActiveSessionId()).toBeNull();
      expect(writeActiveSessionId("x")).toBeUndefined();
    } finally {
      if (originalLocalStorage) Object.defineProperty(window, "localStorage", originalLocalStorage);
    }
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
});
