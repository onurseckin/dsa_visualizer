import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import type { TriviaSessionRecord } from "../../types/trivia";
import { readActiveSessionId, readTriviaSessions } from "../../trivia/triviaSessions";

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

const readActiveSessionRecord = (): TriviaSessionRecord => {
  const sessions = readTriviaSessions();
  const activeId = readActiveSessionId();
  const found = activeId !== null ? sessions.find((s) => s.id === activeId) : undefined;
  if (!found) throw new Error("No active session — test assumed one was selected");
  return found;
};

describe("/trivia route session lifecycle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('auto-creates and enters "Session 1" on a genuine first visit, landing directly on Setup', async () => {
    await renderTriviaRoute();

    expect(await screen.findByText("Build your deck")).toBeInTheDocument();
    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("0 in deck")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start drilling" })).toBeDisabled();

    const sessions = readTriviaSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].name).toBe("Session 1");
    expect(sessions[0].lastScreen).toBe("setup");
    expect(sessions[0].config.deck).toEqual([]);
    expect(readActiveSessionId()).toBe(sessions[0].id);
  });

  it("creates a new session from Home and lands directly on its empty Setup screen", async () => {
    await renderTriviaRoute();
    await screen.findByText("Build your deck");
    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });

    fireEvent.click(screen.getAllByRole("button", { name: "New session" })[0]);

    expect(await screen.findByText("Build your deck")).toBeInTheDocument();
    expect(screen.getByText("New session")).toBeInTheDocument();
    expect(screen.getByText("0 in deck")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start drilling" })).toBeDisabled();

    const created = readActiveSessionRecord();
    expect(created.name).toBe("Session 2");
    expect(created.lastScreen).toBe("setup");
    expect(created.config.deck).toEqual([]);
  });

  it("deleting every session returns Home to its empty state — zero sessions is legitimate now", async () => {
    await renderTriviaRoute();
    await screen.findByText("Build your deck");
    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    await screen.findByRole("heading", { name: "Trivia" });

    expect(screen.getByRole("button", { name: /^Delete / })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /^Delete / }));
    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));

    expect(await screen.findByText("Build your first trivia deck")).toBeInTheDocument();
    expect(readTriviaSessions()).toEqual([]);
  });
});
