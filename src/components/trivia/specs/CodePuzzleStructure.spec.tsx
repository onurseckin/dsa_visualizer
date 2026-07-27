import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodePuzzle } from "../../../ui";
import type { CodePuzzleProps } from "../../../ui";
import { parsePuzzleLines } from "../../../trivia/triviaEngine";
import type { TriviaRound } from "../../../types/trivia";
import { N_QUEENS_CODE } from "../../../algorithms/backtracking/nQueens";

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

const slot = (line: number): HTMLElement =>
  screen.getByRole("button", { name: new RegExp(`^Line ${line} `) });

describe("CodePuzzleStructure Component Spec", () => {
  it("prints the solution with line numbers and turns each blank into a labelled slot", () => {
    renderPuzzle();

    expect(screen.getByTestId("code-row-1")).toHaveTextContent("def two_sum(nums, target):");
    expect(screen.getByTestId("code-row-3")).toHaveTextContent("for i, n in enumerate(nums):");
    expect(screen.getByTestId("code-row-1")).toHaveTextContent("1");

    expect(screen.queryByTestId("code-row-2")).not.toBeInTheDocument();
    expect(screen.getByTestId("blank-row-2")).toBeInTheDocument();
    expect(slot(2)).toBeInTheDocument();
    expect(slot(5)).toBeInTheDocument();
    expect(screen.getByTestId("code-puzzle-well")).toBeInTheDocument();
  });

  it("renders the indent as a fixed prefix outside the graded slot", () => {
    renderPuzzle();

    expect(screen.getByTestId("indent-2").textContent).toBe("    ");
    expect(screen.getByTestId("indent-5").textContent).toBe("            ");
    expect(screen.getByTestId("indent-5")).toHaveAttribute("aria-hidden", "true");
    expect(slot(5)).toHaveTextContent("drop a line here");
  });

  it("renders a plain code row's indentation through its own span, preserving nested Python indentation levels", () => {
    const nQueensLines = parsePuzzleLines(N_QUEENS_CODE);
    const round: TriviaRound = {
      algorithmId: "n-queens",
      level: 0,
      lines: nQueensLines,
      blanks: [],
      tiles: [],
    };
    renderPuzzle({ round });

    expect(screen.getByTestId("indent-2").textContent).toBe("    ");
    expect(screen.getByTestId("indent-7").textContent).toBe("        ");
    expect(screen.getByTestId("indent-8").textContent).toBe("            ");
    expect(screen.getByTestId("indent-13").textContent).toBe("                ");

    const lengths = [2, 7, 8, 13].map(
      (n) => screen.getByTestId(`indent-${n}`).textContent?.length ?? 0,
    );
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
    expect(new Set(lengths).size).toBe(4);

    expect(screen.getByTestId("code-row-13")).toHaveTextContent("continue");
    expect(screen.getByTestId("code-row-1")).toHaveTextContent(
      "def solve_n_queens(n: int) -> list[list[str]]:",
    );
  });

  it("offers a monospace input per blank in type mode", () => {
    const { props } = renderPuzzle({ round: makeRound([2]), mode: "type" });

    const field = screen.getByRole("textbox", { name: /^Line 2 / });
    expect(field).toHaveAttribute("placeholder", "type the line");
    expect(field.parentElement).toHaveClass("font-mono");

    fireEvent.change(field, { target: { value: "  seen = {}  " } });
    expect(props.onTypeAnswer).toHaveBeenCalledWith(2, "  seen = {}  ");

    expect(screen.queryByText("drop a line here")).not.toBeInTheDocument();
  });

  it("zeroes the blank slot's own left inset so its text aligns with a plain code row's first character (TASKS.md 9.3)", () => {
    const { props, view } = renderPuzzle({ round: makeRound([2]), mode: "type" });

    const field = screen.getByRole("textbox", { name: /^Line 2 / });
    expect(field.closest(".ui-input")).toHaveClass("code-slot-input");

    view.rerender(<CodePuzzle {...props} mode="choice" />);
    expect(slot(2)).toHaveClass("code-slot-btn");
  });

  it("submits on Enter from a focused blank input", () => {
    const onSubmit = vi.fn();
    renderPuzzle({ round: makeRound([2]), mode: "type", onSubmit });

    fireEvent.keyDown(screen.getByRole("textbox", { name: /^Line 2 / }), { key: "Enter" });
    expect(onSubmit).toHaveBeenCalled();
  });

  it("Tab and Shift+Tab cycle only through the blank inputs in ascending order, wrapping at both ends", () => {
    renderPuzzle({ round: makeRound([2, 4, 5]), mode: "type" });

    const first = screen.getByRole("textbox", { name: /^Line 2 / });
    const second = screen.getByRole("textbox", { name: /^Line 4 / });
    const third = screen.getByRole("textbox", { name: /^Line 5 / });

    first.focus();
    fireEvent.keyDown(first, { key: "Tab" });
    expect(second).toHaveFocus();

    fireEvent.keyDown(second, { key: "Tab" });
    expect(third).toHaveFocus();

    fireEvent.keyDown(third, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(third).toHaveFocus();
  });
});
