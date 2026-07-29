import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TriviaSession } from "../TriviaSession";
import { parsePuzzleLines } from "../../../trivia/triviaEngine";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../../types/trivia";

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
const DECOY = "seen[n] = i";

const choiceRound = (blanks: number[] = [2, 5]): TriviaRound => ({
  algorithmId: "two-sum",
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: [
    { id: "answer-2", text: ANSWER_2, correctFor: 2 },
    { id: "decoy-0", text: DECOY, correctFor: null },
    { id: "answer-5", text: ANSWER_5, correctFor: 5 },
    { id: "decoy-1", text: "return seen", correctFor: null },
  ],
});

const setup = (
  round: TriviaRound,
  mode: TriviaMode = "choice",
  extra: {
    onEditSettings?: () => void;
    onBackToHome?: () => void;
    onStudyInWorkspace?: (algorithmId?: string) => void;
    hints?: TriviaMeta["hints"];
  } = {},
) => {
  const onSubmit = vi.fn();
  const onNext = vi.fn();
  const view = render(
    <TriviaSession
      round={round}
      algorithmTitle="Two Sum"
      mode={mode}
      level={round.level}
      coverage={43}
      onSubmit={onSubmit}
      onNext={onNext}
      onEditSettings={extra.onEditSettings}
      onBackToHome={extra.onBackToHome}
      onStudyInWorkspace={extra.onStudyInWorkspace}
      hints={extra.hints}
    />,
  );
  return { onSubmit, onNext, view };
};

const slot = (line: number): HTMLElement =>
  screen.getByRole("button", { name: new RegExp(`^Line ${line} `) });
const tile = (text: string): HTMLElement => screen.getByRole("button", { name: `Tile ${text}` });
const checkButton = (): HTMLElement => screen.getByRole("button", { name: /^Check answers/ });
const retryButton = (): HTMLElement => screen.getByRole("button", { name: /^Retry/ });

const makeTransfer = () => {
  const payload = new Map<string, string>();
  return {
    payload,
    setData: (format: string, value: string) => payload.set(format, value),
    getData: (format: string) => payload.get(format) ?? "",
    effectAllowed: "none",
  };
};

const place = (text: string, line: number): void => {
  const dataTransfer = makeTransfer();
  fireEvent.dragStart(tile(text), { dataTransfer });
  fireEvent.drop(slot(line), { dataTransfer });
};

afterEach(() => {
  window.localStorage.clear();
});

describe("TriviaSession Component Spec - Shortcuts & Controls", () => {
  it("marks the current shortcut-target blank so Alt+E is discoverable directly on the Eye button itself", () => {
    setup(choiceRound());
    expect(screen.getByTestId("shortcut-target-2")).toBeInTheDocument();
    expect(screen.queryByTestId("shortcut-target-5")).not.toBeInTheDocument();

    place(ANSWER_2, 2);
    // Line 2 is filled now, so line 5 becomes the new current target.
    expect(screen.getByTestId("shortcut-target-5")).toBeInTheDocument();
    expect(screen.queryByTestId("shortcut-target-2")).not.toBeInTheDocument();
  });

  it("reveals the current-target line with the global Alt+E shortcut even when nothing is focused", () => {
    setup(choiceRound());

    fireEvent.keyDown(window, { key: "e", altKey: true });

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute("aria-label", expect.stringMatching(/revealed/i));
  });

  it("clears the board with the global ⌘R shortcut regardless of focus", () => {
    setup(choiceRound());
    place(ANSWER_2, 2);
    expect(slot(2)).toHaveTextContent(ANSWER_2);

    fireEvent.keyDown(window, { key: "r", metaKey: true });
    expect(slot(2)).toHaveAttribute("data-state", "empty");
  });

  it("yields every global shortcut while a learner is typing a review response", () => {
    const { onSubmit, onNext } = setup(choiceRound());
    const input = document.createElement("textarea");
    document.body.append(input);
    input.focus();

    fireEvent.keyDown(input, { key: "r", metaKey: true });
    fireEvent.keyDown(input, { key: "e", altKey: true });
    fireEvent.keyDown(input, { key: "h", metaKey: true });
    fireEvent.keyDown(input, { key: "Enter", metaKey: true });

    expect(slot(2)).toHaveAttribute("data-state", "empty");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
    input.remove();
  });

  it("yields every global shortcut while a dialog owns the keyboard", () => {
    const { onSubmit, onNext } = setup(choiceRound());
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    document.body.append(dialog);

    fireEvent.keyDown(window, { key: "r", metaKey: true });
    fireEvent.keyDown(window, { key: "e", altKey: true });
    fireEvent.keyDown(window, { key: "h", metaKey: true });
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });

    expect(slot(2)).toHaveAttribute("data-state", "empty");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
    dialog.remove();
  });

  it("checks the round with the global ⌘Enter shortcut even when nothing is focused, once every blank is filled", () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);

    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: ANSWER_5 });
  });

  it("does not check with ⌘Enter while blanks remain empty", () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("advances with the global ⌘Enter shortcut once graded, even when nothing is focused", () => {
    const { onNext } = setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    fireEvent.click(checkButton());

    fireEvent.keyDown(window, { key: "Enter", metaKey: true });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("shows a visible Retry control with its ⌘R hint, clearing the board without fetching a new round", () => {
    const { onNext } = setup(choiceRound());

    place(ANSWER_2, 2);
    expect(retryButton()).toBeInTheDocument();

    fireEvent.click(retryButton());
    expect(slot(2)).toHaveAttribute("data-state", "empty");
    expect(onNext).not.toHaveBeenCalled();
  });
});
