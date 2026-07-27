import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TriviaConfig } from "../../../types/trivia";
import { DEFAULT_TRIVIA_CONFIG } from "../../../trivia/triviaEngine";
import { TriviaSettings } from "../../../ui";

const config = (patch: Partial<TriviaConfig> = {}): TriviaConfig => ({
  ...DEFAULT_TRIVIA_CONFIG,
  ...patch,
});

const slider = (label: RegExp): HTMLInputElement => {
  const input = screen.getByLabelText(label);
  return input as HTMLInputElement;
};

describe("TriviaSettingsWarnings Component Spec", () => {
  it("warns when some deck algorithms have the hardest level or fewer lines, without blocking the slider", () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 8 })}
        onChange={vi.fn()}
        deckLineCounts={[3, 8, 20]}
      />,
    );

    expect(
      screen.getByText(
        "2 of 3 questions in this deck have 8 lines or fewer and will be shown fully blank at this level.",
      ),
    ).toBeInTheDocument();
    expect(slider(/hardest level/i)).not.toBeDisabled();
  });

  it("warns on the exact boundary: a question with precisely maxBlanks lines is fully blanked too", () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 5 })}
        onChange={vi.fn()}
        deckLineCounts={[5, 12]}
      />,
    );

    expect(
      screen.getByText(
        "1 of 2 questions in this deck have 5 lines or fewer and will be shown fully blank at this level.",
      ),
    ).toBeInTheDocument();
  });

  it("omits the short-deck warning once every algorithm strictly exceeds the hardest level", () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 3 })}
        onChange={vi.fn()}
        deckLineCounts={[4, 8, 20]}
      />,
    );

    expect(
      screen.queryByText(/questions in this deck have .* lines or fewer/i),
    ).not.toBeInTheDocument();
  });

  it("omits the short-deck warning when the deck is empty", () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 3 })}
        onChange={vi.fn()}
        deckLineCounts={[]}
      />,
    );

    expect(
      screen.queryByText(/questions in this deck have .* lines or fewer/i),
    ).not.toBeInTheDocument();
  });

  it('uses singular "line" phrasing when maxBlanks is 1', () => {
    render(
      <TriviaSettings
        config={config({ minBlanks: 1, maxBlanks: 1 })}
        onChange={vi.fn()}
        deckLineCounts={[1, 5]}
      />,
    );

    expect(
      screen.getByText(
        "1 of 2 questions in this deck have 1 line or fewer and will be shown fully blank at this level.",
      ),
    ).toBeInTheDocument();
  });
});
