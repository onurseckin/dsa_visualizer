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
const roundHeading = (): HTMLElement => screen.getByRole("heading", { level: 2, name: "Two Sum" });

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

describe("TriviaSession Component Spec - Rendering & Layout", () => {
  it("names the algorithm, states the level and explains the mode", () => {
    setup(choiceRound());

    expect(roundHeading()).toBeInTheDocument();
    expect(screen.getByText("Hiding 2 lines")).toBeInTheDocument();
    expect(screen.getByText(/Drag the matching line into each blank/i)).toBeInTheDocument();
    expect(screen.getByText("Tiles")).toBeInTheDocument();
  });

  it('says "Hiding 1 line" for a single-blank round', () => {
    setup(choiceRound([2]));
    expect(screen.getByText("Hiding 1 line")).toBeInTheDocument();
  });

  it('shows the trailing "Level N · X% covered" line instead of a badge row', () => {
    setup(choiceRound());
    expect(screen.getByText("Level 2 · 43% covered")).toBeInTheDocument();
  });

  it("renders the drilled algorithm's problem description above the puzzle", () => {
    setup(choiceRound());

    expect(screen.getByRole("heading", { level: 1, name: "Two Sum" })).toBeInTheDocument();
    expect(screen.getByTestId("problem-description-details")).toBeInTheDocument();
  });

  it('renders neither "Edit deck & settings" nor "Back to Trivia Home" when no handler is given', () => {
    setup(choiceRound());
    expect(screen.queryByRole("button", { name: "Edit deck & settings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back to Trivia Home" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exit to setup" })).not.toBeInTheDocument();
    expect(screen.queryByText(/pause/i)).not.toBeInTheDocument();
  });

  it("fires onEditSettings and onBackToHome as two separate, never-shared handlers (TASKS.md 9.1)", () => {
    const onEditSettings = vi.fn();
    const onBackToHome = vi.fn();
    setup(choiceRound(), "choice", { onEditSettings, onBackToHome });

    fireEvent.click(screen.getByRole("button", { name: "Edit deck & settings" }));
    expect(onEditSettings).toHaveBeenCalledTimes(1);
    expect(onBackToHome).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Back to Trivia Home" }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
    expect(onEditSettings).toHaveBeenCalledTimes(1);
  });

  it("never renders a ghost-variant button anywhere on the drill screen (9.5)", () => {
    setup(choiceRound(), "choice", { onEditSettings: vi.fn(), onBackToHome: vi.fn() });
    place(ANSWER_2, 2);

    screen.getAllByRole("button").forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });
});
