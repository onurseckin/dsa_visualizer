import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
import { createProgress } from "../../trivia/triviaEngine";
import { ALGORITHM_REGISTRY } from "../../algorithms/registry";

const DECK: TriviaConfig = {
  deck: ["bubble-sort"],
  mode: "choice",
  minBlanks: 3,
  maxBlanks: 4,
  includeDistractors: false,
};

const FOUR_DECK: TriviaConfig = {
  ...DECK,
  deck: ["two-sum", "bubble-sort", "binary-search-matrix", "bfs-graph"],
  minBlanks: 1,
  maxBlanks: 3,
};

const renderTriviaRoute = async () => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/trivia"] }),
  });
  const res = render(<RouterProvider router={router} />);
  await act(async () => {
    await router.load();
  });
  return res;
};

const revealButtons = () => screen.getAllByRole("button", { name: /^Reveal line \d+$/ });

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

describe("/trivia route drilling flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts a session with a code puzzle once an algorithm is picked", async () => {
    await renderTriviaRoute();
    await screen.findByText("Build your deck");

    fireEvent.change(screen.getByLabelText("Filter algorithms"), {
      target: { value: "bubble" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add all Arrays & Hashing" }));

    expect(await screen.findByText("1 in deck")).toBeInTheDocument();
    await waitFor(() => {
      expect(readActiveSessionRecord().config.deck).toEqual(["bubble-sort"]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Start drilling" }));

    expect(await screen.findByTestId("code-puzzle-well")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Bubble Sort" })).toBeInTheDocument();
    expect(screen.getByTestId("code-puzzle-well")).toBeInTheDocument();
    expect(screen.getAllByText("Tiles").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^Check answers/ })).toBeDisabled();
    expect(screen.queryByText("Build your deck")).not.toBeInTheDocument();

    expect(screen.queryByText(/Level \d+ · \d+% covered/)).not.toBeInTheDocument();
    expect(screen.getByText("Hiding 1 line")).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(1);
    expect(readActiveSessionRecord().lastScreen).toBe("drill");
  });

  it("restores a session seeded mid-Drill and reports the hidden lines count", async () => {
    seedActiveSession("Session 1", DECK, createProgress(DECK), "drill");

    await renderTriviaRoute();

    expect(screen.queryByText(/Level \d+ · \d+% covered/)).not.toBeInTheDocument();
    expect(await screen.findByTestId("code-puzzle-well")).toBeInTheDocument();
    expect(screen.getByText("Hiding 3 lines")).toBeInTheDocument();
    expect(revealButtons()).toHaveLength(3);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(0);
    expect(screen.queryByText("Build your deck")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Trivia" })).not.toBeInTheDocument();
  });

  it("drills a four-algorithm deck, serving a real solution from the deck each round", async () => {
    seedActiveSession("Session 1", FOUR_DECK, createProgress(FOUR_DECK), "drill");
    await renderTriviaRoute();
    await screen.findByTestId("code-puzzle-well");

    const titles = FOUR_DECK.deck.map((id) => ALGORITHM_REGISTRY[id].title);
    expect(readActiveSessionRecord().config.deck).toEqual(FOUR_DECK.deck);

    for (let round = 0; round < 4; round += 1) {
      const heading = screen.getByRole("heading", { level: 2 });
      expect(titles).toContain(heading.textContent);
      expect(revealButtons()).toHaveLength(1);

      revealButtons().forEach((button) => fireEvent.click(button));
      const check = screen.getByRole("button", { name: /^Check answers/ });
      await waitFor(() => expect(check).toBeEnabled());
      fireEvent.click(check);

      await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(round + 1));
      fireEvent.click(screen.getByRole("button", { name: /^(Next round|Try again)/ }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^Check answers/ })).toBeDisabled();
      });
    }

    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(4);
  });

  it("grades a submitted round, persists the progress, and serves the next one", async () => {
    seedActiveSession("Session 1", DECK, createProgress(DECK), "drill");
    await renderTriviaRoute();
    await screen.findByTestId("code-puzzle-well");

    revealButtons().forEach((button) => fireEvent.click(button));

    const check = screen.getByRole("button", { name: /^Check answers/ });
    await waitFor(() => expect(check).toBeEnabled());
    fireEvent.click(check);

    await waitFor(() => expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1));

    const drilled = readActiveSessionRecord().progress.drilled["bubble-sort"]?.["3"] ?? [];
    expect(drilled).toHaveLength(3);

    expect(screen.queryByText(/Level \d+ · \d+% covered/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^(Next round|Try again)/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Check answers/ })).toBeDisabled();
    });
    expect(revealButtons()).toHaveLength(3);
    expect(readActiveSessionRecord().progress.roundsPlayed).toBe(1);
  });
});
