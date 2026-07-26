import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
import { MIN_PANEL_HEIGHT_PX, TRIVIA_LAYOUT_KEY } from "../../trivia/triviaLayout";
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
  return render(<RouterProvider router={router} />);
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

describe("/trivia route navigation and layout", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('"Edit deck & settings" returns to Setup without losing the deck or leaving the session', async () => {
    seedActiveSession("Session 1", DECK, createProgress(DECK), "drill");
    await renderTriviaRoute();
    const sessionId = readActiveSessionId();
    await screen.findByText("solution.py");

    fireEvent.click(screen.getByRole("button", { name: "Edit deck & settings" }));

    expect(await screen.findByText("Build your deck")).toBeInTheDocument();
    expect(screen.getByText("1 in deck")).toBeInTheDocument();
    expect(screen.queryByText("solution.py")).not.toBeInTheDocument();
    expect(readActiveSessionId()).toBe(sessionId);
    expect(readActiveSessionRecord().lastScreen).toBe("setup");

    fireEvent.click(screen.getByRole("button", { name: "Start drilling" }));
    expect(await screen.findByText("solution.py")).toBeInTheDocument();
  });

  it('"Back to Trivia Home" from Setup lands on Home, and a remount stays on Home — the user\'s exact repeated complaint', async () => {
    seedActiveSession("Session 1", DECK, { ...createProgress(DECK), roundsPlayed: 1 }, "setup");
    await renderTriviaRoute();
    await screen.findByText("Build your deck");

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));

    expect(await screen.findByRole("heading", { name: "Trivia" })).toBeInTheDocument();
    expect(screen.queryByText("Build your deck")).not.toBeInTheDocument();
    expect(readActiveSessionId()).toBeNull();

    cleanup();
    await renderTriviaRoute();

    expect(await screen.findByRole("heading", { name: "Trivia" })).toBeInTheDocument();
    expect(screen.queryByText("Build your deck")).not.toBeInTheDocument();
    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("Paused · Setup")).toBeInTheDocument();
  });

  it('"Back to Trivia Home" from Drill records lastScreen: drill, so Resume returns to Drill next time, with a fresh round (never claiming to restore exact blanks)', async () => {
    seedActiveSession("Session 1", DECK, { ...createProgress(DECK), roundsPlayed: 1 }, "drill");
    await renderTriviaRoute();
    await screen.findByText("solution.py");

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));

    expect(await screen.findByRole("heading", { name: "Trivia" })).toBeInTheDocument();
    expect(screen.getByText("Paused · Drilling")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resume" })).toHaveAttribute(
      "title",
      expect.stringMatching(/Resumes at Level \d+ with a new round/),
    );

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));

    expect(await screen.findByText("solution.py")).toBeInTheDocument();
    expect(readActiveSessionRecord().lastScreen).toBe("drill");
  });

  it('offers "Back to Trivia Home" as a distinct exit from the completion card, not just "Adjust settings"', async () => {
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

    expect(
      screen.getByRole("button", { name: "Adjust settings to keep going" }),
    ).toBeInTheDocument();
    const homeBtn = screen.getByRole("button", { name: "Back to Trivia Home" });

    fireEvent.click(homeBtn);

    expect(await screen.findByRole("heading", { name: "Trivia" })).toBeInTheDocument();
    expect(readActiveSessionId()).toBeNull();
    expect(screen.getByText("Deck complete")).toBeInTheDocument();
  });

  it("persists a resized Home session-list panel height across a reload", async () => {
    const { unmount } = await renderTriviaRoute();
    await screen.findByText("Build your deck");
    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });

    const handle = screen.getByRole("separator", { name: "Resize the trivia session list" });
    expect(handle).toHaveAttribute("aria-valuetext", "Automatic, sized to content");

    fireEvent.keyDown(handle, { key: "ArrowDown" });

    const stored = JSON.parse(window.localStorage.getItem(TRIVIA_LAYOUT_KEY) ?? "null");
    expect(stored?.panelHeights.sessionList).toBe(MIN_PANEL_HEIGHT_PX);
    expect(handle).toHaveAttribute("aria-valuenow", String(MIN_PANEL_HEIGHT_PX));

    unmount();
    await renderTriviaRoute();
    await screen.findByRole("heading", { name: "Trivia" });

    const reloadedHandle = screen.getByRole("separator", {
      name: "Resize the trivia session list",
    });
    expect(reloadedHandle).toHaveAttribute("aria-valuenow", String(MIN_PANEL_HEIGHT_PX));
    expect(reloadedHandle).not.toHaveAttribute("aria-valuetext");
  });

  it("never renders a ghost-variant button anywhere on the /trivia route (9.5)", async () => {
    await renderTriviaRoute();
    await screen.findByText("Build your deck");
    screen.getAllByRole("button").forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });
    screen.getAllByRole("button").forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });
});
