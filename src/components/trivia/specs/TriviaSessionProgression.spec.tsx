import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TriviaSession } from "../TriviaSession";
import { TILE_MIME } from "../../../ui";
import { parsePuzzleLines } from "../../../trivia/triviaEngine";
import type { TriviaMode, TriviaRound } from "../../../types/trivia";

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

const choiceRound = (blanks: number[] = [2, 5]): TriviaRound => ({
  algorithmId: "two-sum",
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: [
    { id: "answer-2", text: ANSWER_2, correctFor: 2 },
    { id: "decoy-0", text: "seen[n] = i", correctFor: null },
    { id: "answer-5", text: ANSWER_5, correctFor: 5 },
    { id: "decoy-1", text: "return seen", correctFor: null },
  ],
});

const setup = (round: TriviaRound, mode: TriviaMode = "choice") => {
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
    />,
  );
  return { onSubmit, onNext, view };
};

const slot = (line: number): HTMLElement =>
  screen.getByRole("button", { name: new RegExp(`^Line ${line} `) });
const tile = (text: string): HTMLElement => screen.getByRole("button", { name: `Tile ${text}` });
const placedTile = (text: string): HTMLElement =>
  screen.getByRole("button", { name: `Tile ${text} (placed)` });
const checkButton = (): HTMLElement => screen.getByRole("button", { name: /^Check answers/ });
const nextButton = (): HTMLElement => screen.getByRole("button", { name: /^Next round/ });

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

describe("TriviaSessionProgression Component Spec", () => {
  it("advances only once the round has been graded", () => {
    const { onNext } = setup(choiceRound());

    expect(screen.queryByRole("button", { name: /^Next round/ })).not.toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    fireEvent.click(checkButton());

    expect(nextButton()).toBeEnabled();
    expect(nextButton()).toHaveClass("ui-btn--primary");

    fireEvent.click(nextButton());
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("places a dragged tile into a specific blank — the still-supported way to fill out of order", () => {
    const { onSubmit } = setup(choiceRound());
    const dataTransfer = makeTransfer();

    fireEvent.dragStart(tile(ANSWER_2), { dataTransfer });
    fireEvent.dragOver(slot(2), { dataTransfer });
    fireEvent.drop(slot(2), { dataTransfer });
    fireEvent.dragEnd(placedTile(ANSWER_2));

    expect(dataTransfer.payload.get(TILE_MIME)).toBe("answer-2");
    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(placedTile(ANSWER_2)).toBeDisabled();

    fireEvent.dragStart(tile(ANSWER_5), { dataTransfer });
    fireEvent.drop(slot(5), { dataTransfer });
    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: ANSWER_5 });
    expect(screen.getByText(/2 of 2 correct/)).toBeInTheDocument();
  });

  it("resets the board when the next round arrives", () => {
    const { view, onSubmit, onNext } = setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.click(screen.getByRole("button", { name: "Reveal line 5" }));
    fireEvent.click(checkButton());
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();

    view.rerender(
      <TriviaSession
        round={choiceRound([3])}
        algorithmTitle="Two Sum"
        mode="choice"
        level={1}
        coverage={43}
        onSubmit={onSubmit}
        onNext={onNext}
      />,
    );

    expect(screen.getByText("Hiding 1 line")).toBeInTheDocument();
    expect(slot(3)).toHaveAttribute("data-state", "empty");
    expect(checkButton()).toBeDisabled();
    expect(screen.queryByText(/correct$/)).not.toBeInTheDocument();
    expect(screen.getByText("4 left")).toBeInTheDocument();
  });
});
