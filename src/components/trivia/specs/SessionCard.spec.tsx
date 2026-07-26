import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionCard, badgeForSession } from "../components/SessionCard";
import type { TriviaSessionRecord } from "../../../types/trivia";
import { DEFAULT_TRIVIA_CONFIG } from "../../../trivia/triviaEngine";

describe("SessionCard component & badgeForSession", () => {
  const baseSession: TriviaSessionRecord = {
    id: "s-1",
    name: "Sample Session",
    createdAt: 1000,
    updatedAt: 2000,
    config: DEFAULT_TRIVIA_CONFIG,
    progress: { level: 1, drilled: {}, stats: {}, completed: false, roundsPlayed: 0 },
    lastScreen: "setup",
  };

  it("badgeForSession returns correct badge labels and variants", () => {
    expect(badgeForSession(baseSession)).toEqual({ label: "New", variant: "info" });

    const completedSession: TriviaSessionRecord = {
      ...baseSession,
      progress: { ...baseSession.progress, completed: true },
    };
    expect(badgeForSession(completedSession)).toEqual({
      label: "Deck complete",
      variant: "success",
    });

    const pausedSetup: TriviaSessionRecord = {
      ...baseSession,
      progress: { ...baseSession.progress, roundsPlayed: 2 },
      lastScreen: "setup",
    };
    expect(badgeForSession(pausedSetup)).toEqual({ label: "Paused · Setup", variant: "neutral" });

    const pausedDrilling: TriviaSessionRecord = {
      ...baseSession,
      progress: { ...baseSession.progress, roundsPlayed: 2 },
      lastScreen: "drill",
    };
    expect(badgeForSession(pausedDrilling)).toEqual({
      label: "Paused · Drilling",
      variant: "neutral",
    });
  });

  it("renders normal view with stats and handles action button clicks", () => {
    const onStartRename = vi.fn();
    const onSaveRename = vi.fn();
    const onCancelRename = vi.fn();
    const onEditingNameChange = vi.fn();
    const onResumeSession = vi.fn();
    const onPendingDelete = vi.fn();

    render(
      <SessionCard
        session={baseSession}
        stats={{ level: 2, maxBlanks: 5, rounds: 3, coveragePct: 40 }}
        isEditing={false}
        editingName="Sample Session"
        onStartRename={onStartRename}
        onSaveRename={onSaveRename}
        onCancelRename={onCancelRename}
        onEditingNameChange={onEditingNameChange}
        onResumeSession={onResumeSession}
        onPendingDelete={onPendingDelete}
      />,
    );

    expect(screen.getByText("Sample Session")).toBeInTheDocument();
    expect(screen.getByText("Level 2 of 5 · 3 rounds · 40% covered")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(onResumeSession).toHaveBeenCalledWith(baseSession);

    fireEvent.click(screen.getByRole("button", { name: "Rename Sample Session" }));
    expect(onStartRename).toHaveBeenCalledWith(baseSession);

    fireEvent.click(screen.getByRole("button", { name: "Delete Sample Session" }));
    expect(onPendingDelete).toHaveBeenCalledWith(baseSession.id);
  });

  it("renders editing view and handles Enter, Escape, and Save click", () => {
    const onSaveRename = vi.fn();
    const onCancelRename = vi.fn();
    const onEditingNameChange = vi.fn();

    render(
      <SessionCard
        session={baseSession}
        isEditing={true}
        editingName="Editing Session Name"
        onStartRename={vi.fn()}
        onSaveRename={onSaveRename}
        onCancelRename={onCancelRename}
        onEditingNameChange={onEditingNameChange}
        onResumeSession={vi.fn()}
        onPendingDelete={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Rename Sample Session" });
    expect(input).toHaveValue("Editing Session Name");

    fireEvent.change(input, { target: { value: "New Name" } });
    expect(onEditingNameChange).toHaveBeenCalledWith("New Name");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSaveRename).toHaveBeenCalledWith("s-1");

    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancelRename).toHaveBeenCalled();

    const saveBtn = screen.getByRole("button", { name: "Save session name" });
    fireEvent.click(saveBtn);
    expect(onSaveRename).toHaveBeenCalledTimes(2);
  });
});
