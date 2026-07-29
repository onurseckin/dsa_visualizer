import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parsePuzzleLines } from "../../../trivia/triviaEngine";
import type { TriviaRound } from "../../../types/trivia";
import { TriviaSession } from "../TriviaSession";

const round: TriviaRound = {
  algorithmId: "prefix-sum",
  level: 1,
  lines: parsePuzzleLines("def prefix(values):\n    running += value\n    return running"),
  blanks: [2],
  tiles: [],
  variant: "prefix-sum-line-2-invariant",
  retrievalPrompt: {
    kind: "invariant",
    prompt: "State the accumulator invariant after this update.",
  },
  misconceptionCodes: { 2: "drops-prefix-invariant" },
};

afterEach(() => {
  window.localStorage.clear();
});

describe("TriviaSession mastery reflection", () => {
  it("requires a written invariant and confidence before advancing", () => {
    const onReview = vi.fn();
    const onNext = vi.fn();
    render(
      <TriviaSession
        round={round}
        algorithmTitle="Prefix Sum"
        mode="type"
        level={1}
        coverage={20}
        onSubmit={vi.fn()}
        onReview={onReview}
        onNext={onNext}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /^Line 2 / }), {
      target: { value: "running += value" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Check answers/ }));

    expect(screen.getByText("State the accumulator invariant after this update.")).toBeVisible();
    const next = screen.getByRole("button", { name: /^Next round/ });
    expect(next).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: "Retrieval reflection" }), {
      target: { value: "Running equals the sum of the processed prefix." },
    });
    fireEvent.click(screen.getByRole("radio", { name: "4 — confident" }));
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(onReview).toHaveBeenCalledWith({
      confidence: 4,
      response: "Running equals the sum of the processed prefix.",
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("shows the authored misconception code after a miss", () => {
    render(
      <TriviaSession
        round={round}
        algorithmTitle="Prefix Sum"
        mode="type"
        level={1}
        coverage={20}
        onSubmit={vi.fn()}
        onReview={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /^Line 2 / }), {
      target: { value: "running = value" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Check answers/ }));

    expect(screen.getByText("Review focus: drops prefix invariant")).toBeVisible();
  });
});
