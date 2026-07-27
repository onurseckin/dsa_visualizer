import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

describe("/trivia route session switching", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows an unambiguous "New session" identity right after creating one, distinct from a session with real progress', async () => {
    seedActiveSession("Session 1", DECK, { ...createProgress(DECK), roundsPlayed: 1 }, "drill");
    await renderTriviaRoute();
    await screen.findByTestId("code-puzzle-well");

    fireEvent.click(screen.getByRole("button", { name: "Edit deck & settings" }));
    expect(await screen.findByText("Paused · progress saved")).toBeInTheDocument();
    expect(screen.queryByText("New session")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });
    fireEvent.click(screen.getAllByRole("button", { name: "New session" })[0]);

    expect(await screen.findByText("New session")).toBeInTheDocument();
    expect(screen.queryByText("Paused · progress saved")).not.toBeInTheDocument();
    expect(readActiveSessionRecord().config.deck).toEqual([]);
  });

  it("keeps the sessions list and active pointer consistent through rename, delete, and create in quick succession, all from Home", async () => {
    await renderTriviaRoute();
    await screen.findByText("Build your deck");
    const sessionA = readActiveSessionRecord();

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });
    fireEvent.click(screen.getAllByRole("button", { name: "New session" })[0]);
    await screen.findByText("Build your deck");
    const sessionB = readActiveSessionRecord();

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });
    fireEvent.click(screen.getAllByRole("button", { name: "New session" })[0]);
    await screen.findByText("Build your deck");
    const sessionC = readActiveSessionRecord();

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(3));

    fireEvent.click(screen.getByRole("button", { name: `Rename ${sessionC.name}` }));
    fireEvent.change(screen.getByDisplayValue(sessionC.name), {
      target: { value: "Focus Session" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save session name" }));
    expect(await screen.findByText("Focus Session")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `Delete ${sessionB.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(2));

    fireEvent.click(screen.getAllByRole("button", { name: "New session" })[0]);
    await screen.findByText("Build your deck");
    await waitFor(() => expect(readTriviaSessions()).toHaveLength(3));
    const sessionD = readActiveSessionRecord();

    const finalSessions = readTriviaSessions();
    expect(finalSessions.find((s) => s.id === sessionB.id)).toBeUndefined();
    const finalA = finalSessions.find((s) => s.id === sessionA.id);
    expect(finalA).toBeDefined();
    expect(finalA?.name).toBe(sessionA.name);
    const finalC = finalSessions.find((s) => s.id === sessionC.id);
    expect(finalC?.name).toBe("Focus Session");
    expect(readActiveSessionId()).toBe(sessionD.id);
    expect(sessionD.id).not.toBe(sessionB.id);
    expect(finalSessions.map((s) => s.id).sort()).toEqual(
      [sessionA.id, sessionC.id, sessionD.id].sort(),
    );
  });

  it("keeps two sessions fully independent: switching back and forth via Home restores each one exactly as left", async () => {
    await renderTriviaRoute();
    await screen.findByText("Build your deck");

    fireEvent.change(screen.getByLabelText("Filter algorithms"), { target: { value: "bubble" } });
    fireEvent.click(screen.getByRole("button", { name: "Add all Arrays & Hashing" }));
    await waitFor(() => expect(readActiveSessionRecord().config.deck).toEqual(["bubble-sort"]));
    fireEvent.click(screen.getByRole("button", { name: "Start drilling" }));
    await screen.findByTestId("code-puzzle-well");

    updateSession(readActiveSessionId()!, {
      progress: {
        ...readActiveSessionRecord().progress,
        roundsPlayed: 1,
        drilled: { "bubble-sort": { "1": [0, 1] } },
      },
    });

    const sessionAId = readActiveSessionId();
    const drilledOnA = readActiveSessionRecord().progress.drilled["bubble-sort"]?.["1"] ?? [];
    expect(drilledOnA.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    expect(await screen.findByRole("heading", { name: "Trivia" })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "New session" })[0]);
    await screen.findByText("Build your deck");
    const sessionBId = readActiveSessionId();
    expect(sessionBId).not.toBe(sessionAId);
    expect(readActiveSessionRecord().config.deck).toEqual([]);

    fireEvent.change(screen.getByLabelText("Filter algorithms"), { target: { value: "two" } });
    fireEvent.click(screen.getByRole("button", { name: "Add all Arrays & Hashing" }));
    await waitFor(() => expect(readActiveSessionRecord().config.deck).toEqual(["two-sum"]));
    fireEvent.click(screen.getByRole("button", { name: "Start drilling" }));
    await screen.findByTestId("code-puzzle-well");
    updateSession(readActiveSessionId()!, {
      progress: {
        ...readActiveSessionRecord().progress,
        roundsPlayed: 1,
        drilled: { "two-sum": { "1": [0, 1] } },
      },
    });

    const sessionBSnapshot = readActiveSessionRecord();
    expect(sessionBSnapshot.id).toBe(sessionBId);
    expect(sessionBSnapshot.config.deck).toEqual(["two-sum"]);

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });

    const sessionAName = readTriviaSessions().find((s) => s.id === sessionAId)?.name ?? "";
    const sessionACard = screen.getByText(sessionAName).closest(".ui-card");
    if (!sessionACard) throw new Error("Session A card not found on Home");
    fireEvent.click(within(sessionACard as HTMLElement).getByRole("button", { name: "Resume" }));
    await waitFor(() => expect(readActiveSessionId()).toBe(sessionAId));

    const resumedA = readActiveSessionRecord();
    expect(resumedA.config.deck).toEqual(["bubble-sort"]);
    expect(resumedA.progress.roundsPlayed).toBe(1);
    expect(resumedA.progress.drilled["bubble-sort"]?.["1"]).toEqual(drilledOnA);
    expect(resumedA.progress.drilled["two-sum"]).toBeUndefined();

    const sessionBAfter = readTriviaSessions().find((s) => s.id === sessionBId);
    expect(sessionBAfter?.config.deck).toEqual(["two-sum"]);
    expect(sessionBAfter?.progress.roundsPlayed).toBe(1);
  });
});
