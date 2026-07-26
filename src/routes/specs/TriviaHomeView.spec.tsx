import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaHomeView } from "../trivia/-components/TriviaHomeView";
import { DEFAULT_TRIVIA_LAYOUT, TriviaLayout } from "../../trivia/triviaLayout";
import type { TriviaSessionRecord } from "../../types/trivia";

const mockSession: TriviaSessionRecord = {
  id: "session-1",
  name: "Test Session",
  createdAt: 1000,
  updatedAt: 1000,
  config: {
    deck: ["bubble-sort"],
    mode: "choice",
    minBlanks: 1,
    maxBlanks: 3,
    includeDistractors: false,
  },
  progress: {
    level: 1,
    drilled: {},
    stats: {},
    completed: false,
    roundsPlayed: 0,
  },
  lastScreen: "setup",
};

describe("TriviaHomeView component", () => {
  it("renders automatic height layout (null height slot)", () => {
    const layout: TriviaLayout = {
      ...DEFAULT_TRIVIA_LAYOUT,
      panelHeights: { ...DEFAULT_TRIVIA_LAYOUT.panelHeights, sessionList: null },
    };

    const ref = createRef<HTMLDivElement>();
    const setDragging = vi.fn();
    const nudge = vi.fn();
    const restoreDefault = vi.fn();

    render(
      <TriviaHomeView
        sessions={[mockSession]}
        layout={layout}
        sessionListPanel={{
          ref,
          dragging: false,
          setDragging,
          nudge,
          restoreDefault,
        }}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    expect(screen.getByText("Test Session")).toBeInTheDocument();
    const handle = screen.getByRole("separator", { name: "Resize the trivia session list" });
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-valuetext", "Automatic, sized to content");
  });

  it("renders pinned height layout (non-null sessionList height)", () => {
    const layout: TriviaLayout = {
      ...DEFAULT_TRIVIA_LAYOUT,
      panelHeights: { ...DEFAULT_TRIVIA_LAYOUT.panelHeights, sessionList: 320 },
    };

    const ref = createRef<HTMLDivElement>();
    const setDragging = vi.fn();
    const nudge = vi.fn();
    const restoreDefault = vi.fn();

    render(
      <TriviaHomeView
        sessions={[mockSession]}
        layout={layout}
        sessionListPanel={{
          ref,
          dragging: true,
          setDragging,
          nudge,
          restoreDefault,
        }}
        onCreateNewSession={vi.fn()}
        onResumeSession={vi.fn()}
        onRenameSession={vi.fn()}
        onDeleteSession={vi.fn()}
      />,
    );

    const handle = screen.getByRole("separator", { name: "Resize the trivia session list" });
    expect(handle).toHaveAttribute("aria-valuenow", "320");
    expect(handle).not.toHaveAttribute("aria-valuetext");

    // Trigger drag start
    fireEvent.mouseDown(handle);
    expect(setDragging).toHaveBeenCalledWith(true);
  });

  it("triggers action callbacks when interacting with session list actions", () => {
    const onCreateNewSession = vi.fn();
    const onResumeSession = vi.fn();
    const onRenameSession = vi.fn();
    const onDeleteSession = vi.fn();

    render(
      <TriviaHomeView
        sessions={[mockSession]}
        layout={DEFAULT_TRIVIA_LAYOUT}
        sessionListPanel={{
          ref: createRef<HTMLDivElement>(),
          dragging: false,
          setDragging: vi.fn(),
          nudge: vi.fn(),
          restoreDefault: vi.fn(),
        }}
        onCreateNewSession={onCreateNewSession}
        onResumeSession={onResumeSession}
        onRenameSession={onRenameSession}
        onDeleteSession={onDeleteSession}
      />,
    );

    // Create session button
    const createBtn = screen.getByRole("button", { name: "New session" });
    fireEvent.click(createBtn);
    expect(onCreateNewSession).toHaveBeenCalledTimes(1);

    // Resume session card button
    const resumeBtn = screen.getByRole("button", { name: "Resume" });
    fireEvent.click(resumeBtn);
    expect(onResumeSession).toHaveBeenCalledWith(mockSession);
  });
});
