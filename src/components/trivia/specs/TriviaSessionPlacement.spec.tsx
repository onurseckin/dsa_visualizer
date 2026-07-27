import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TriviaSession } from "../TriviaSession";
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

const setup = (round: TriviaRound) => {
  const onSubmit = vi.fn();
  const onNext = vi.fn();
  const view = render(
    <TriviaSession
      round={round}
      algorithmTitle="Two Sum"
      mode="choice"
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

describe("TriviaSession Component Spec - Tile Placement", () => {
  it("fills the next empty blank directly on a plain tile click — no second click on a slot required", () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));

    expect(slot(2)).toHaveTextContent(ANSWER_2);
    expect(slot(2)).toHaveAttribute("data-state", "filled");
    expect(placedTile(ANSWER_2)).toBeDisabled();
    expect(screen.getByText("3 left")).toBeInTheDocument();
  });

  it("keeps filling forward: the next plain click lands on the next still-empty blank", () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));
    expect(slot(2)).toHaveTextContent(ANSWER_2);

    fireEvent.click(tile(ANSWER_5));
    expect(slot(5)).toHaveTextContent(ANSWER_5);
  });

  it("fills the next empty blank on a plain click, while a drag can still target a specific later blank out of order", () => {
    setup(choiceRound());

    fireEvent.click(tile(ANSWER_2));
    expect(slot(2)).toHaveTextContent(ANSWER_2);

    const dataTransfer = makeTransfer();
    fireEvent.dragStart(tile(ANSWER_5), { dataTransfer });
    fireEvent.drop(slot(5), { dataTransfer });

    expect(slot(5)).toHaveTextContent(ANSWER_5);
  });

  it("falls back to select-then-click-a-slot once every blank already has an answer", () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    place(ANSWER_5, 5);

    fireEvent.click(tile(DECOY));
    expect(tile(DECOY)).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(slot(2));
    expect(slot(2)).toHaveTextContent(DECOY);
  });

  it("returns the tile to the tray when a filled slot is activated again", () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    fireEvent.click(slot(2));

    expect(slot(2)).toHaveTextContent("drop a line here");
    expect(slot(2)).toHaveAttribute("data-state", "empty");
    expect(tile(ANSWER_2)).toBeEnabled();
    expect(screen.getByText("4 left")).toBeInTheDocument();
  });

  it("sends the displaced tile back to the tray when a slot is reused", () => {
    setup(choiceRound());

    place(ANSWER_2, 2);
    place(DECOY, 2);

    expect(slot(2)).toHaveTextContent(DECOY);
    expect(tile(ANSWER_2)).toBeEnabled();
    expect(placedTile(DECOY)).toBeDisabled();
  });

  it("drops the held tile on Escape after a drag-start selects it", () => {
    setup(choiceRound());
    const dataTransfer = makeTransfer();

    fireEvent.dragStart(tile(ANSWER_2), { dataTransfer });
    expect(tile(ANSWER_2)).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(tile(ANSWER_2), { key: "Escape" });

    expect(tile(ANSWER_2)).toHaveAttribute("aria-pressed", "false");
    expect(slot(2).style.borderColor).toBe("var(--border-strong)");
  });

  it("never lets one tile occupy two slots", () => {
    setup(choiceRound());
    const dataTransfer = makeTransfer();

    fireEvent.dragStart(tile(ANSWER_2), { dataTransfer });
    fireEvent.drop(slot(2), { dataTransfer });
    fireEvent.drop(slot(5), { dataTransfer });

    expect(slot(2)).toHaveAttribute("data-state", "empty");
    expect(slot(5)).toHaveTextContent(ANSWER_2);
  });

  it("ignores a drop that carries an id from outside the round", () => {
    setup(choiceRound());

    fireEvent.drop(slot(2), { dataTransfer: { getData: () => "answer-99" } });

    expect(slot(2)).toHaveAttribute("data-state", "empty");
  });
});
