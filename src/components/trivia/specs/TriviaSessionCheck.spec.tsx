import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TriviaSession } from "../TriviaSession";
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

const typeRound = (blanks: number[] = [2, 5]): TriviaRound => ({
  algorithmId: "two-sum",
  level: blanks.length,
  lines: LINES,
  blanks,
  tiles: [],
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
const field = (line: number): HTMLElement =>
  screen.getByRole("textbox", { name: new RegExp(`^Line ${line} `) });
const checkButton = (): HTMLElement => screen.getByRole("button", { name: /^Check answers/ });

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

describe("TriviaSessionCheck Component Spec", () => {
  it("will not check a 2-blank round until both blanks are filled", () => {
    const { onSubmit } = setup(choiceRound());

    expect(checkButton()).toBeDisabled();

    place(ANSWER_2, 2);
    expect(checkButton()).toBeDisabled();

    place(ANSWER_5, 5);
    expect(checkButton()).toBeEnabled();

    fireEvent.click(checkButton());
    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: ANSWER_5 });
  });

  it("grades correct blanks green and wrong blanks red, with a summary", () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    place(DECOY, 5);
    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: DECOY });
    expect(slot(2).style.borderColor).toBe("var(--success)");
    expect(slot(5).style.borderColor).toBe("var(--danger)");
    expect(screen.getByTestId("expected-5")).toHaveTextContent(ANSWER_5);
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /^Check answers/ })).not.toBeInTheDocument();
    expect(slot(2)).toBeDisabled();
    expect(placedTile(DECOY)).toBeDisabled();
    expect(tile("return seen")).toBeDisabled();
  });

  it("reports an all-correct round as such", () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);
    fireEvent.click(checkButton());

    expect(screen.getByRole("status")).toHaveTextContent("2 of 2 correct");
  });

  it("grades typed answers with surrounding whitespace ignored", () => {
    const { onSubmit } = setup(typeRound(), "type");

    expect(screen.queryByText("Tiles")).not.toBeInTheDocument();

    fireEvent.change(field(2), { target: { value: `  ${ANSWER_2}  ` } });
    fireEvent.change(field(5), { target: { value: `\t${ANSWER_5}` } });
    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: `  ${ANSWER_2}  `, 5: `\t${ANSWER_5}` });
    expect(screen.getByText(/2 of 2 correct/)).toBeInTheDocument();
    expect(slot(2).style.borderColor).toBe("var(--success)");
    expect(slot(5).style.borderColor).toBe("var(--success)");
  });

  it("fills a revealed blank with the truth but never credits it", () => {
    const { onSubmit } = setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.click(screen.getByRole("button", { name: "Reveal line 5" }));

    expect(slot(5)).toHaveTextContent(ANSWER_5);
    expect(checkButton()).toBeEnabled();

    fireEvent.click(checkButton());

    expect(onSubmit).toHaveBeenCalledWith({ 2: ANSWER_2, 5: "" });
    expect(slot(5)).toHaveAttribute("data-state", "incorrect");
    expect(screen.getByText(/1 of 2 correct/)).toBeInTheDocument();
    expect(slot(5)).toHaveAttribute("aria-label", expect.stringMatching(/revealed, not credited/i));
  });
});
