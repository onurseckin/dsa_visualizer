import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaSetupView } from "../trivia/-components/TriviaSetupView";
import { DEFAULT_TRIVIA_LAYOUT, TriviaLayout } from "../../trivia/triviaLayout";
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../../types/trivia";

const mockConfig: TriviaConfig = {
  deck: ["bubble-sort"],
  mode: "choice",
  minBlanks: 1,
  maxBlanks: 3,
  includeDistractors: false,
};

const mockProgress: TriviaProgress = {
  level: 1,
  drilled: {},
  stats: {},
  completed: false,
  roundsPlayed: 0,
};

const mockSession: TriviaSessionRecord = {
  id: "session-1",
  name: "Active Session",
  createdAt: 1000,
  updatedAt: 1000,
  config: mockConfig,
  progress: mockProgress,
  lastScreen: "setup",
};

describe("TriviaSetupView component", () => {
  it("renders with empty deck notice and automatic panel heights", () => {
    const setSettingsDragging = vi.fn();
    const setDeckBuilderDragging = vi.fn();

    render(
      <TriviaSetupView
        activeSession={mockSession}
        level={1}
        config={{ ...mockConfig, deck: [] }}
        progress={mockProgress}
        sourcesSize={0}
        coverage={0}
        isDeckEmpty={true}
        deckLineCounts={[]}
        layout={DEFAULT_TRIVIA_LAYOUT}
        settingsPanel={{
          ref: createRef<HTMLDivElement>(),
          dragging: false,
          setDragging: setSettingsDragging,
          nudge: vi.fn(),
          restoreDefault: vi.fn(),
        }}
        deckBuilderPanel={{
          ref: createRef<HTMLDivElement>(),
          dragging: false,
          setDragging: setDeckBuilderDragging,
          nudge: vi.fn(),
          restoreDefault: vi.fn(),
        }}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={vi.fn()}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Add at least one algorithm to the deck to start drilling."),
    ).toBeInTheDocument();

    const handle = screen.getByRole("separator", {
      name: "Resize drill settings and deck builder",
    });
    expect(handle).toHaveAttribute("aria-valuetext", "Automatic, sized to content");

    fireEvent.mouseDown(handle);
    expect(setSettingsDragging).toHaveBeenCalledWith(true);
  });

  it("renders with non-empty deck, pinned heights, and triggers settings changes", () => {
    const onChangeSettings = vi.fn();
    const layout: TriviaLayout = {
      ...DEFAULT_TRIVIA_LAYOUT,
      panelHeights: {
        ...DEFAULT_TRIVIA_LAYOUT.panelHeights,
        settings: 300,
        deckBuilder: 450,
      },
    };

    render(
      <TriviaSetupView
        activeSession={mockSession}
        level={1}
        config={mockConfig}
        progress={mockProgress}
        sourcesSize={1}
        coverage={25}
        isDeckEmpty={false}
        deckLineCounts={[12]}
        layout={layout}
        settingsPanel={{
          ref: createRef<HTMLDivElement>(),
          dragging: false,
          setDragging: vi.fn(),
          nudge: vi.fn(),
          restoreDefault: vi.fn(),
        }}
        deckBuilderPanel={{
          ref: createRef<HTMLDivElement>(),
          dragging: false,
          setDragging: vi.fn(),
          nudge: vi.fn(),
          restoreDefault: vi.fn(),
        }}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={vi.fn()}
        onChangeSettings={onChangeSettings}
      />,
    );

    expect(
      screen.queryByText("Add at least one algorithm to the deck to start drilling."),
    ).not.toBeInTheDocument();

    const handle = screen.getByRole("separator", {
      name: "Resize drill settings and deck builder",
    });
    expect(handle).toHaveAttribute("aria-valuenow", "300");
    expect(handle).not.toHaveAttribute("aria-valuetext");
  });
});
