import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaSessionsManager } from "../TriviaSessionsManager";
import type { TriviaSessionRecord } from "../../../types/trivia";
import { DEFAULT_TRIVIA_CONFIG, createProgress } from "../../../trivia/triviaEngine";

/* Round-3 IA fix (TASKS.md 9.1): this is trivia's Home screen now, rendered
   on-page whenever activeSessionId is null — not a Drawer popover. */
describe("TriviaSessionsManager (trivia Home screen)", () => {
  const dummySession: TriviaSessionRecord = {
    id: "session_1",
    name: "Session 1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: DEFAULT_TRIVIA_CONFIG,
    progress: createProgress(DEFAULT_TRIVIA_CONFIG),
    lastScreen: "setup",
  };

  const otherSession: TriviaSessionRecord = {
    ...dummySession,
    id: "session_2",
    name: "Session 2",
    lastScreen: "drill",
  };

  it("shows the empty state with no forced session when there are zero sessions", () => {
    render(
      <TriviaSessionsManager
        sessions={[]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText("Trivia")).toBeInTheDocument();
    expect(screen.getByText("Build your first trivia deck")).toBeInTheDocument();
    // Two "New session" affordances exist by design (header + empty state) —
    // both must work, not just one.
    const newSessionButtons = screen.getAllByRole("button", { name: "New session" });
    expect(newSessionButtons).toHaveLength(2);
    expect(screen.queryByText("Session 1")).not.toBeInTheDocument();
  });

  it("creates a new session from the always-visible header button", () => {
    const onCreateNewSession = vi.fn();
    render(
      <TriviaSessionsManager
        sessions={[dummySession]}
        onCreateNewSession={onCreateNewSession}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "New session" }));
    expect(onCreateNewSession).toHaveBeenCalledTimes(1);
  });

  it("renders every session as a card with a name, status badge, and one-line stats", () => {
    render(
      <TriviaSessionsManager
        sessions={[dummySession, otherSession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("Session 2")).toBeInTheDocument();
    // Never-drilled sessions read "New", not a status-derived label.
    expect(screen.getAllByText("New")).toHaveLength(2);
    expect(screen.getAllByText(/Level \d+ of \d+ · \d+ rounds? · \d+% covered/)).toHaveLength(2);
  });

  it("labels a paused session by which screen it will resume on", () => {
    const progress = { ...createProgress(DEFAULT_TRIVIA_CONFIG), roundsPlayed: 3 };
    const setupSession: TriviaSessionRecord = { ...dummySession, progress, lastScreen: "setup" };
    const drillSession: TriviaSessionRecord = {
      ...otherSession,
      progress,
      lastScreen: "drill",
    };

    render(
      <TriviaSessionsManager
        sessions={[setupSession, drillSession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText("Paused · Setup")).toBeInTheDocument();
    expect(screen.getByText("Paused · Drilling")).toBeInTheDocument();
  });

  it('labels a finished session "Deck complete"', () => {
    const finished: TriviaSessionRecord = {
      ...dummySession,
      progress: { ...createProgress(DEFAULT_TRIVIA_CONFIG), completed: true },
    };

    render(
      <TriviaSessionsManager
        sessions={[finished]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText("Deck complete")).toBeInTheDocument();
  });

  it("resumes a session via its own card action, passing the whole record up", () => {
    const onResumeSession = vi.fn();
    render(
      <TriviaSessionsManager
        sessions={[dummySession, otherSession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={onResumeSession}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Resume" })[0]);
    expect(onResumeSession).toHaveBeenCalledWith(dummySession);
  });

  it("renames a session inline from its card", () => {
    const onRenameSession = vi.fn();
    render(
      <TriviaSessionsManager
        sessions={[dummySession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={onRenameSession}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Rename Session 1" }));
    const input = screen.getByDisplayValue("Session 1");
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save session name" }));
    expect(onRenameSession).toHaveBeenCalledWith("session_1", "Renamed");
  });

  it("deletes a session only after the confirm dialog is accepted, and allows deleting the last one", () => {
    const onDeleteSession = vi.fn();
    render(
      <TriviaSessionsManager
        sessions={[dummySession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={onDeleteSession}
      />,
    );

    // Zero sessions is a legitimate state now (Home's own empty state), so
    // deleting the last remaining session is not blocked.
    expect(screen.getByRole("button", { name: "Delete Session 1" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Delete Session 1" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Delete this session?");
    expect(onDeleteSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete session" }));
    expect(onDeleteSession).toHaveBeenCalledWith("session_1");
  });

  it("cancels a pending delete without calling onDeleteSession", () => {
    const onDeleteSession = vi.fn();
    render(
      <TriviaSessionsManager
        sessions={[dummySession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={onDeleteSession}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Session 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep it" }));
    expect(onDeleteSession).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("never renders a ghost-variant button anywhere on the Home screen (9.5)", () => {
    render(
      <TriviaSessionsManager
        sessions={[dummySession, otherSession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    screen.getAllByRole("button").forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });

  it("handles sessions with unknown algorithm IDs in deck", () => {
    const unknownAlgSession: TriviaSessionRecord = {
      ...dummySession,
      config: { ...DEFAULT_TRIVIA_CONFIG, deck: ["non_existent_alg_id"] },
    };
    render(
      <TriviaSessionsManager
        sessions={[unknownAlgSession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );
    expect(screen.getByText("Session 1")).toBeInTheDocument();
  });

  it("does not trigger onRenameSession when saving empty or whitespace-only name", () => {
    const onRenameSession = vi.fn();
    render(
      <TriviaSessionsManager
        sessions={[dummySession]}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={onRenameSession}
        onDeleteSession={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Rename Session 1" }));
    const input = screen.getByDisplayValue("Session 1");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save session name" }));

    expect(onRenameSession).not.toHaveBeenCalled();
  });
});
