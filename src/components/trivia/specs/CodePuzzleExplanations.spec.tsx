import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodePuzzle } from "../../../ui";
import type { CodePuzzleProps } from "../../../ui";
import { parsePuzzleLines } from "../../../trivia/triviaEngine";
import type { TriviaRound } from "../../../types/trivia";

const CODE = [
  "def two_sum(nums, target):",
  "    seen = {}",
  "    for i, n in enumerate(nums):",
  "        if target - n in seen:",
  "            return [seen[target - n], i]",
  "        seen[n] = i",
].join("\n");

const LINES = parsePuzzleLines(CODE);

const makeRound = (blanks: number[]): TriviaRound => ({
  algorithmId: "two-sum",
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: blanks.map((number) => ({
    id: `answer-${number}`,
    text: LINES[number - 1].content,
    correctFor: number,
  })),
});

const handlers = () => ({
  onSlotActivate: vi.fn(),
  onTileDrop: vi.fn(),
  onTypeAnswer: vi.fn(),
  onReveal: vi.fn(),
});

const renderPuzzle = (overrides: Partial<CodePuzzleProps> = {}) => {
  const props: CodePuzzleProps = {
    round: makeRound([2, 5]),
    mode: "choice",
    filled: {},
    ...handlers(),
    ...overrides,
  };
  const view = render(<CodePuzzle {...props} />);
  return { props, view };
};

describe("CodePuzzleExplanations Component Spec", () => {
  it("marks the current shortcut-target blank with a single Kbd hint, never repeated per row", () => {
    renderPuzzle({ activeShortcutLine: 5 });

    expect(screen.getByTestId("shortcut-target-5")).toBeInTheDocument();
    expect(screen.queryByTestId("shortcut-target-2")).not.toBeInTheDocument();
  });

  it("shows a left-side hover popover when hovering a plain code row", () => {
    renderPuzzle({
      round: makeRound([5]),
      lineExplanations: { 1: "Declares the function signature." },
    });

    const row = screen.getByTestId("code-row-1");
    fireEvent.mouseEnter(row);
    const popover = screen.getByTestId("line-explain-popover-1");
    expect(popover).toHaveTextContent("Declares the function signature.");
    expect(popover).toHaveAttribute("data-side", "left");

    fireEvent.mouseLeave(row);
    expect(screen.queryByTestId("line-explain-popover-1")).not.toBeInTheDocument();
  });

  it("does nothing when hovering a code row with no authored explanation", () => {
    renderPuzzle({ round: makeRound([5]), lineExplanations: { 3: "Walks the array." } });

    fireEvent.mouseEnter(screen.getByTestId("code-row-1"));
    expect(screen.queryByTestId("line-explain-popover-1")).not.toBeInTheDocument();
  });

  it("shows a left-side hover popover for an explained blank row too", () => {
    renderPuzzle({ round: makeRound([2, 5]), lineExplanations: { 2: "An empty seen map." } });

    const row = screen.getByTestId("blank-row-2");
    fireEvent.mouseEnter(row);

    const popover = screen.getByTestId("line-explain-popover-2");
    expect(popover).toHaveTextContent("An empty seen map.");
    expect(popover).toHaveAttribute("data-side", "left");
  });
});
