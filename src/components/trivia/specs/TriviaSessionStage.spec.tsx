import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaSessionStage } from "../components/TriviaSessionStage";
import type { TriviaRound } from "../../../types/trivia";
import type { useTriviaSessionState } from "../hooks/useTriviaSessionState";

const mockRound: TriviaRound = {
  algorithmId: "bubble-sort",
  level: 1,
  lines: [
    {
      number: 1,
      text: "def bubble_sort(arr):",
      indent: "",
      content: "def bubble_sort(arr):",
      blankable: true,
    },
    { number: 2, text: "    return arr", indent: "    ", content: "return arr", blankable: true },
  ],
  blanks: [2],
  tiles: [{ id: "t1", text: "return arr", correctFor: 2 }],
};

const mockSessionState = {
  filledAnswers: {},
  revealed: [],
  grade: null,
  selectedTileId: null,
  usedTileIds: new Set<string>(),
  graded: false,
  correctCount: 0,
  allFilled: false,
  modeDescription: "Multiple choice",
  openHints: new Set<number>(),
  currentTargetLine: null,
  problemExpanded: true,
  layout: {
    version: 3,
    problemSplitPercent: 35,
    puzzleSplitPercent: 65,
    panelHeights: {
      sessionList: null,
      deckBuilder: null,
      settings: null,
      problem: null,
      puzzle: null,
    },
    problemExpanded: true,
    panelVisibility: {
      problem: true,
      puzzle: true,
      tiles: true,
    },
  },
  problemPanel: {
    ref: { current: null },
    dragging: false,
    setDragging: vi.fn(),
    nudge: vi.fn(),
    restoreDefault: vi.fn(),
  },
  puzzlePanel: {
    ref: { current: null },
    dragging: false,
    setDragging: vi.fn(),
    nudge: vi.fn(),
    restoreDefault: vi.fn(),
  },
  handleSlotActivate: vi.fn(),
  placeTile: vi.fn(),
  handleTypeAnswer: vi.fn(),
  handleReveal: vi.fn(),
  handleCheck: vi.fn(),
  handleSelectTile: vi.fn(),
  handleActivateTile: vi.fn(),
  toggleHint: vi.fn(),
  handleSplitChange: vi.fn(),
  handleSplitCommit: vi.fn(),
} as unknown as ReturnType<typeof useTriviaSessionState>;

describe("TriviaSessionStage component", () => {
  it("renders puzzle and tile tray when mode is choice", () => {
    render(<TriviaSessionStage round={mockRound} mode="choice" session={mockSessionState} />);

    expect(screen.getByText("bubble_sort")).toBeInTheDocument();
    expect(
      screen.getByRole("separator", { name: "Resize Puzzle and Tiles rows" }),
    ).toBeInTheDocument();
  });

  it("renders puzzle only without resizable columns when mode is type", () => {
    render(<TriviaSessionStage round={mockRound} mode="type" session={mockSessionState} />);

    expect(screen.getByText("bubble_sort")).toBeInTheDocument();
    expect(
      screen.queryByRole("separator", { name: "Resize puzzle and tiles columns" }),
    ).not.toBeInTheDocument();
  });
});
