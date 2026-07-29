import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import { parsePuzzleLines } from "../../trivia/triviaEngine";
import { createSession, updateSession, writeActiveSessionId } from "../../trivia/triviaSessions";

const renderTriviaRoute = async (initialPath = "/trivia") => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  const view = render(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });
  return { router, view };
};

describe("useTriviaPage hook & route integration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders setup view when deck is empty and disables Start drilling button", async () => {
    const s = createSession("Empty Deck Session", {
      deck: [],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 3,
      includeDistractors: false,
    });
    updateSession(s.id, { lastScreen: "drill" });
    writeActiveSessionId(s.id);

    await renderTriviaRoute();
    await screen.findByText("Build your deck");
    expect(screen.getByRole("button", { name: "Start drilling" })).toBeDisabled();
  });

  it("handles navigation to workspace with study algorithm fallback", async () => {
    const s = createSession("Deck Session", {
      deck: ["bubble-sort"],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 2,
      includeDistractors: false,
    });
    writeActiveSessionId(s.id);

    const { router } = await renderTriviaRoute();
    await screen.findByText("Build your deck");
    fireEvent.click(screen.getByRole("button", { name: "Start drilling" }));
    await screen.findByTestId("code-puzzle-well");

    const studyButton = screen.getByRole("button", { name: /Study in workspace/i });
    fireEvent.click(studyButton);

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/\/workspace\//);
    });
  });

  it("handles editing settings and returning to home from setup", async () => {
    const s = createSession("Setup Nav Session", {
      deck: ["bubble-sort"],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 2,
      includeDistractors: false,
    });
    writeActiveSessionId(s.id);

    await renderTriviaRoute();
    await screen.findByText("Build your deck");

    // Back to Trivia Home
    const backBtn = screen.getByRole("button", { name: "Back to Trivia Home" });
    fireEvent.click(backBtn);
    await screen.findByRole("button", { name: "New session" });
  });

  it("handles drill flow, edit settings from drill, and home navigation from drill", async () => {
    const s = createSession("Drill Session", {
      deck: ["bubble-sort"],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 2,
      includeDistractors: false,
    });
    updateSession(s.id, { lastScreen: "drill" });
    writeActiveSessionId(s.id);

    await renderTriviaRoute();
    await screen.findByTestId("code-puzzle-well");

    // Click Edit deck & settings
    const editBtn = screen.getByRole("button", { name: "Edit deck & settings" });
    fireEvent.click(editBtn);
    await screen.findByText("Build your deck");
  });

  it("renders TriviaCompletionView when session progress is completed", async () => {
    const s = createSession("Completed Session", {
      deck: ["bubble-sort"],
      mode: "choice",
      minBlanks: 1,
      maxBlanks: 2,
      includeDistractors: false,
    });
    updateSession(s.id, {
      lastScreen: "drill",
      progress: {
        level: 2,
        drilled: { "bubble-sort": { "2": [1, 2, 3, 4, 5, 6, 7, 8] } },
        stats: {},
        completed: true,
        roundsPlayed: 10,
      },
    });
    writeActiveSessionId(s.id);

    await renderTriviaRoute();
    await screen.findByText("Deck complete");

    const editBtn = screen.getByRole("button", { name: "Adjust settings to keep going" });
    fireEvent.click(editBtn);
    await screen.findByText("Build your deck");
  });

  it("keeps the final semantic round visible until its retrieval reflection is submitted", async () => {
    const s = createSession("Final Reflection", {
      deck: ["bubble-sort"],
      mode: "type",
      minBlanks: 1,
      maxBlanks: 1,
      includeDistractors: false,
    });
    updateSession(s.id, {
      lastScreen: "drill",
      activeRound: {
        algorithmId: "bubble-sort",
        level: 1,
        lines: parsePuzzleLines("def bubble_sort(values):\n    return values"),
        blanks: [2],
        tiles: [],
        variant: "bubble-sort-line-2-prediction",
        retrievalPrompt: {
          kind: "prediction",
          prompt: "Predict what changes for an empty input.",
        },
      },
      progress: {
        level: 1,
        drilled: { "bubble-sort": { "1": [2] } },
        stats: { "bubble-sort": { "2": { attempts: 1, misses: 0 } } },
        completed: true,
        roundsPlayed: 1,
      },
    });
    writeActiveSessionId(s.id);

    await renderTriviaRoute();

    await screen.findByTestId("code-puzzle-well");
    expect(screen.queryByText("Deck complete")).not.toBeInTheDocument();
  });

  it("handles session lifecycle actions on Home view", async () => {
    createSession("Home Session");
    writeActiveSessionId(null);

    await renderTriviaRoute();
    await screen.findByRole("button", { name: "New session" });

    // Create new session
    fireEvent.click(screen.getByRole("button", { name: "New session" }));
    await screen.findByText("Build your deck");
  });
});
