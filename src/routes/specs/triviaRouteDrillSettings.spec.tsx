import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../../types/trivia";
import {
  createSession,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from "../../trivia/triviaSessions";
import { blankableLines, createProgress, parsePuzzleLines } from "../../trivia/triviaEngine";
import { ALGORITHM_REGISTRY } from "../../algorithms/registry";

const DECK: TriviaConfig = {
  deck: ["bubble-sort"],
  mode: "choice",
  minBlanks: 3,
  maxBlanks: 4,
  includeDistractors: false,
};

const renderTriviaRoute = async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/trivia"] }),
  });
  const res = render(<RouterProvider router={router} />);
  await router.load();
  return res;
};

const readActiveSessionRecord = (): TriviaSessionRecord => {
  const sessions = readTriviaSessions();
  const activeId = readActiveSessionId();
  const found = activeId !== null ? sessions.find((s) => s.id === activeId) : undefined;
  if (!found) throw new Error("No active session — test assumed one was selected");
  return found;
};

const seedActiveSession = (
  name: string,
  config: TriviaConfig,
  progress: TriviaProgress,
  lastScreen: "setup" | "drill" = "setup",
): TriviaSessionRecord => {
  const created = createSession(name, config, progress);
  const updated = updateSession(created.id, { lastScreen });
  writeActiveSessionId(created.id);
  return updated ?? created;
};

describe("/trivia route drill settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("raises maxBlanks on a session without resetting its drilled progress, via Edit deck & settings", async () => {
    seedActiveSession("Session 1", DECK, { ...createProgress(DECK), roundsPlayed: 1 }, "drill");
    await renderTriviaRoute();
    await screen.findByText("solution.py");

    const beforeDrilled = readActiveSessionRecord().progress.drilled;
    const beforeStats = readActiveSessionRecord().progress.stats;
    const beforeLevel = readActiveSessionRecord().progress.level;

    fireEvent.click(screen.getByRole("button", { name: "Edit deck & settings" }));
    expect(await screen.findByText("Build your deck")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Hardest level"), { target: { value: "6" } });
    await waitFor(() => expect(readActiveSessionRecord().config.maxBlanks).toBe(6));

    const afterPatch = readActiveSessionRecord();
    expect(afterPatch.progress.roundsPlayed).toBe(1);
    expect(afterPatch.progress.drilled).toEqual(beforeDrilled);
    expect(afterPatch.progress.stats).toEqual(beforeStats);
    expect(afterPatch.progress.level).toBe(beforeLevel);
  });

  it("resumes a session that finished its deck once maxBlanks is raised, without erasing its drilled history", async () => {
    const bubbleSort = ALGORITHM_REGISTRY["bubble-sort"];
    const allBlankable = blankableLines(parsePuzzleLines(bubbleSort.code, bubbleSort.trivia));

    const finishedConfig: TriviaConfig = {
      deck: ["bubble-sort"],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 1,
      includeDistractors: false,
    };
    const finishedProgress: TriviaProgress = {
      level: 1,
      drilled: { "bubble-sort": { "1": allBlankable } },
      stats: {},
      completed: true,
      roundsPlayed: allBlankable.length,
    };
    seedActiveSession("Finished Deck", finishedConfig, finishedProgress, "drill");

    await renderTriviaRoute();
    expect(await screen.findByText("Deck complete")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Adjust settings to keep going" }));
    expect(await screen.findByText("Build your deck")).toBeInTheDocument();

    const beforeDrilled = readActiveSessionRecord().progress.drilled["bubble-sort"]?.["1"] ?? [];

    fireEvent.change(screen.getByLabelText("Hardest level"), { target: { value: "2" } });
    await waitFor(() => expect(readActiveSessionRecord().config.maxBlanks).toBe(2));

    const revived = readActiveSessionRecord();
    expect(revived.progress.completed).toBe(false);
    expect(revived.progress.drilled["bubble-sort"]?.["1"]).toEqual(beforeDrilled);

    fireEvent.click(screen.getByRole("button", { name: "Start drilling" }));
    expect(await screen.findByText("solution.py")).toBeInTheDocument();
    expect(screen.queryByText("Deck complete")).not.toBeInTheDocument();
  });
});
