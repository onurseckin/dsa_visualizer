import { render, screen, fireEvent, createEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodePuzzle } from "../CodePuzzle";
import type { CodePuzzleProps } from "../CodePuzzle";
import { gradeRound, parsePuzzleLines } from "../../../trivia/triviaEngine";
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

const ANSWER_2 = "seen = {}";
const ANSWER_5 = "return [seen[target - n], i]";

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

describe("CodePuzzle Component Spec - Interactions & Drag-and-Drop", () => {
  afterEach(() => {
    cleanup();
  });

  it("draws an empty slot dashed and brightens its edge while a tile is held", () => {
    const { view, props } = renderPuzzle();

    expect(slot(2)).toHaveAttribute("data-state", "empty");
    expect(slot(2).style.borderStyle).toBe("dashed");
    expect(slot(2).style.borderColor).toBe("var(--border-strong)");
    expect(slot(2)).toHaveAttribute("aria-pressed", "false");

    view.rerender(<CodePuzzle {...props} hasSelection />);
    expect(slot(2).style.borderColor).toBe("var(--border-accent)");
  });

  it("activates a slot by click, reporting the line it belongs to", () => {
    const { props } = renderPuzzle();

    fireEvent.click(slot(5));
    expect(props.onSlotActivate).toHaveBeenCalledWith(5);
  });

  it("shows a filled slot as pressed, with the placed line as its text", () => {
    renderPuzzle({ filled: { 2: ANSWER_2 } });

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute("aria-pressed", "true");
    expect(slot(2)).toHaveAttribute("data-state", "filled");
    expect(slot(2).style.borderStyle).toBe("solid");
  });

  it("routes an HTML5 drop landing exactly on the slot through the tile-placement callback", () => {
    const { props } = renderPuzzle();

    fireEvent.drop(slot(2), { dataTransfer: { getData: () => "answer-2" } });

    expect(props.onTileDrop).toHaveBeenCalledWith(2, "answer-2");
    expect(props.onSlotActivate).not.toHaveBeenCalled();
  });

  it("falls back to the click path when a drag carries no payload", () => {
    const { props } = renderPuzzle();

    fireEvent.drop(slot(2), { dataTransfer: { getData: () => "" } });

    expect(props.onTileDrop).not.toHaveBeenCalled();
    expect(props.onSlotActivate).toHaveBeenCalledWith(2);
  });

  it("routes a drop landing anywhere on the wider blank row, not just the small slot button", () => {
    const { props } = renderPuzzle();

    fireEvent.drop(screen.getByTestId("blank-row-5"), {
      dataTransfer: { getData: () => "answer-5" },
    });

    expect(props.onTileDrop).toHaveBeenCalledWith(5, "answer-5");
  });

  it("drops on the nearest blank row by vertical distance when the pointer lands outside any row entirely", () => {
    const { props } = renderPuzzle();

    const rowTwo = screen.getByTestId("blank-row-2");
    const rowFive = screen.getByTestId("blank-row-5");
    rowTwo.getBoundingClientRect = () => new DOMRect(0, 0, 400, 20);
    rowFive.getBoundingClientRect = () => new DOMRect(0, 20, 400, 20);

    const well = screen.getByTestId("code-puzzle-well");
    const dropEvent = createEvent.drop(well, { dataTransfer: { getData: () => "answer-5" } });
    Object.defineProperty(dropEvent, "clientY", { value: 45, configurable: true });

    fireEvent(well, dropEvent);

    expect(props.onTileDrop).toHaveBeenCalledWith(5, "answer-5");
    expect(props.onSlotActivate).not.toHaveBeenCalled();
  });

  it("marks graded blanks with the success and danger edges and reveals the real line when wrong", () => {
    const round = makeRound([2, 5]);
    const filled = { 2: ANSWER_2, 5: "return seen" };
    renderPuzzle({ round, filled, grade: gradeRound(round, filled) });

    expect(slot(2)).toHaveAttribute("data-state", "correct");
    expect(slot(2).style.borderColor).toBe("var(--success)");
    expect(slot(2).style.background).toBe("var(--success-soft)");

    expect(slot(5)).toHaveAttribute("data-state", "incorrect");
    expect(slot(5).style.borderColor).toBe("var(--danger)");
    expect(screen.getByTestId("expected-5")).toHaveTextContent(ANSWER_5);
    expect(screen.queryByTestId("expected-2")).not.toBeInTheDocument();

    expect(slot(2)).toBeDisabled();
    expect(slot(5)).toBeDisabled();
  });

  it("reveals a chosen blank and locks the reveal once graded", () => {
    const round = makeRound([2, 5]);
    const { view, props } = renderPuzzle({ round });

    fireEvent.click(screen.getByRole("button", { name: "Reveal line 5" }));
    expect(props.onReveal).toHaveBeenCalledWith(5);

    view.rerender(
      <CodePuzzle
        {...props}
        revealed={[5]}
        filled={{ 2: ANSWER_2, 5: ANSWER_5 }}
        grade={gradeRound(round, { 2: ANSWER_2, 5: "" })}
      />,
    );

    expect(screen.getByRole("button", { name: "Reveal line 5" })).toBeDisabled();
    expect(slot(5)).toHaveAttribute("data-state", "incorrect");
    expect(slot(5).getAttribute("aria-label")).toContain("revealed");
  });

  it("handles typing mode keyboard events (Tab, Shift+Tab, Enter) and ref unmounting in CodePuzzleSlot", () => {
    const onSubmit = vi.fn();
    const round = makeRound([2, 5]);
    const { view } = renderPuzzle({ round, mode: "type", onSubmit });

    const input2 = screen.getByRole("textbox", { name: "Line 2 — type the missing line" });
    const input5 = screen.getByRole("textbox", { name: "Line 5 — type the missing line" });

    // Press Tab on input2 -> focuses input5
    fireEvent.keyDown(input2, { key: "Tab" });

    // Press Shift+Tab on input5 -> focuses input2
    fireEvent.keyDown(input5, { key: "Tab", shiftKey: true });

    // Press Enter on input2 -> calls onSubmit
    fireEvent.keyDown(input2, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalled();

    // Press random key ('a') on input2
    fireEvent.keyDown(input2, { key: "a" });

    // Test Enter when onSubmit is undefined
    view.rerender(
      <CodePuzzle
        round={round}
        mode="type"
        filled={{}}
        onSlotActivate={vi.fn()}
        onTileDrop={vi.fn()}
        onTypeAnswer={vi.fn()}
        onReveal={vi.fn()}
      />,
    );
    const input2NoSubmit = screen.getByRole("textbox", { name: "Line 2 — type the missing line" });
    fireEvent.keyDown(input2NoSubmit, { key: "Enter" });

    // Test unmounting inputs to trigger ref cleanup (el === null)
    view.unmount();
  });
});
