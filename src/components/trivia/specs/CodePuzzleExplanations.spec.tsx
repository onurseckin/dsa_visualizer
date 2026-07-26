import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodePuzzle } from "../CodePuzzle";
import type { CodePuzzleProps } from "../CodePuzzle";
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

const explainToggle = (): HTMLElement =>
  screen.getByRole("button", { name: "Toggle line explanations" });

describe("CodePuzzleExplanations Component Spec", () => {
  it("keeps author hints behind a per-line toggle (self-managed when unwired to a parent)", () => {
    renderPuzzle({ hints: [{ line: 2, hint: "An empty map of value to index." }] });

    expect(screen.queryByTestId("hint-2")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hint for line 5" })).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: "Hint for line 2" });
    fireEvent.click(toggle);

    expect(screen.getByTestId("hint-2")).toHaveTextContent("An empty map of value to index.");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(toggle);
    expect(screen.queryByTestId("hint-2")).not.toBeInTheDocument();
  });

  it("renders hint-open state as controlled and delegates the toggle upward when openHints/onToggleHint are supplied", () => {
    const onToggleHint = vi.fn();
    renderPuzzle({
      hints: [{ line: 2, hint: "An empty map." }],
      openHints: [2],
      onToggleHint,
    });

    expect(screen.getByTestId("hint-2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hint for line 2" }));
    expect(onToggleHint).toHaveBeenCalledWith(2);
    expect(screen.getByTestId("hint-2")).toBeInTheDocument();
  });

  it("marks the current shortcut-target blank with a single Kbd hint, never repeated per row", () => {
    renderPuzzle({ activeShortcutLine: 5 });

    expect(screen.getByTestId("shortcut-target-5")).toBeInTheDocument();
    expect(screen.queryByTestId("shortcut-target-2")).not.toBeInTheDocument();
  });

  it("renders no hint/explain icon on a blank row for a line missing from lineExplanations and hints", () => {
    renderPuzzle({ lineExplanations: { 5: "Only line 5 is explained." } });

    expect(screen.queryByRole("button", { name: "Hint for line 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hint for line 5" })).toBeInTheDocument();
  });

  it("opens a right-side click popover for a blank row explanation on clicking the lightbulb toggle", () => {
    renderPuzzle({
      hints: [{ line: 2, hint: "An empty map of value to index." }],
      lineExplanations: { 2: "Creates an empty map that remembers values already seen." },
    });

    expect(explainToggle()).not.toHaveAttribute("aria-pressed");

    const hintToggle = screen.getByRole("button", { name: "Hint for line 2" });

    fireEvent.click(hintToggle);
    const popover = screen.getByTestId("line-explain-popover-2");
    expect(popover).toHaveTextContent("Creates an empty map that remembers values already seen.");
    expect(popover).toHaveAttribute("data-side", "right");
    expect(screen.getByTestId("hint-2")).toHaveTextContent("An empty map of value to index.");

    fireEvent.click(hintToggle);
    expect(screen.queryByTestId("line-explain-popover-2")).not.toBeInTheDocument();
  });

  it("does not show a hover popover on a code row until the header toggle is switched on (trivia defaults off)", () => {
    renderPuzzle({
      round: makeRound([5]),
      lineExplanations: { 1: "Declares the function signature." },
    });

    expect(explainToggle()).not.toHaveAttribute("aria-pressed");
    fireEvent.mouseEnter(screen.getByTestId("code-row-1"));
    expect(screen.queryByTestId("line-explain-popover-1")).not.toBeInTheDocument();
  });

  it("shows a left-side popover when hovering a plain code row once the header toggle is switched on", () => {
    renderPuzzle({
      round: makeRound([5]),
      lineExplanations: { 1: "Declares the function signature." },
    });

    fireEvent.click(explainToggle());
    expect(explainToggle()).toHaveAttribute("aria-pressed", "true");

    const row = screen.getByTestId("code-row-1");
    fireEvent.mouseEnter(row);
    const popover = screen.getByTestId("line-explain-popover-1");
    expect(popover).toHaveTextContent("Declares the function signature.");
    expect(popover).toHaveAttribute("data-side", "left");

    fireEvent.mouseLeave(row);
    expect(screen.queryByTestId("line-explain-popover-1")).not.toBeInTheDocument();
  });

  it("does nothing when hovering a code row with no authored explanation, even with the toggle on", () => {
    renderPuzzle({ round: makeRound([5]), lineExplanations: { 3: "Walks the array." } });

    fireEvent.click(explainToggle());
    fireEvent.mouseEnter(screen.getByTestId("code-row-1"));
    expect(screen.queryByTestId("line-explain-popover-1")).not.toBeInTheDocument();
  });

  it("shows a left-side hover popover for an explained blank row too, while the header toggle is on", () => {
    renderPuzzle({ round: makeRound([2, 5]), lineExplanations: { 2: "An empty seen map." } });

    fireEvent.click(explainToggle());
    const row = screen.getByTestId("blank-row-2");
    fireEvent.mouseEnter(row);

    const popover = screen.getByTestId("line-explain-popover-2");
    expect(popover).toHaveTextContent("An empty seen map.");
    expect(popover).toHaveAttribute("data-side", "left");
  });
});
