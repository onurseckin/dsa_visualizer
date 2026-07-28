import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaHeaderCard } from "../TriviaHeaderCard";
import { DEFAULT_TRIVIA_CONFIG, createProgress } from "../../../trivia/triviaEngine";

describe("TriviaHeaderCard - View & Display", () => {
  const config = DEFAULT_TRIVIA_CONFIG;
  const progress = createProgress(config);
  const DECK_LINE_COUNTS = [7, 2, 15];

  it('renders title, badges, and the single "Start drilling" action', () => {
    const onStartDrilling = vi.fn();

    render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress: { ...progress, roundsPlayed: 1 },
          lastScreen: "setup",
        }}
        level={1}
        config={config}
        progress={{ ...progress, roundsPlayed: 1 }}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={onStartDrilling}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("Session 1")).toBeInTheDocument();
    expect(screen.getByText("Paused · progress saved")).toBeInTheDocument();
    expect(screen.getByText("50% covered")).toBeInTheDocument();

    const startBtn = screen.getByRole("button", { name: "Start drilling" });
    fireEvent.click(startBtn);
    expect(onStartDrilling).toHaveBeenCalled();

    expect(screen.queryByRole("button", { name: /new session/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset progress" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Study in workspace" })).not.toBeInTheDocument();
  });

  it('disables "Start drilling" while the deck is empty, and labels a never-drilled session "New"', () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: "setup",
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={0}
        coverage={0}
        isDeckEmpty
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("New session")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start drilling" })).toBeDisabled();
  });

  it("surfaces the deck line-count range in the actions row", () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: "setup",
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[7, 2, 15]}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("Deck lines: 2–15")).toBeInTheDocument();
  });

  it("falls back to a dash for the deck range when the deck is empty", () => {
    render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: "setup",
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={0}
        coverage={0}
        isDeckEmpty
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[]}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("Deck lines: —")).toBeInTheDocument();
  });

  it("shows the configured blanks span in the actions row", () => {
    const { rerender } = render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: { ...config, minBlanks: 2, maxBlanks: 5 },
          progress,
          lastScreen: "setup",
        }}
        level={2}
        config={{ ...config, minBlanks: 2, maxBlanks: 5 }}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );
    expect(screen.getByText("2–5 blanks")).toBeInTheDocument();

    rerender(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: { ...config, minBlanks: 1, maxBlanks: 2 },
          progress,
          lastScreen: "setup",
        }}
        level={1}
        config={{ ...config, minBlanks: 1, maxBlanks: 2 }}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );
    expect(screen.getByText("1–2 blanks")).toBeInTheDocument();
  });

  it("shows a singular fixed blank level without a range separator", () => {
    const fixedConfig = { ...config, minBlanks: 1, maxBlanks: 1 };
    render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config: fixedConfig,
          progress,
          lastScreen: "setup",
        }}
        level={1}
        config={fixedConfig}
        progress={progress}
        sourcesCount={1}
        coverage={100}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[1]}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("1 blank")).toBeInTheDocument();
  });

  it("keeps the merged card neutral with token colours and no raw hex", () => {
    const { container } = render(
      <TriviaHeaderCard
        activeSession={{
          id: "s1",
          name: "Session 1",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          progress,
          lastScreen: "setup",
        }}
        level={1}
        config={config}
        progress={progress}
        sourcesCount={2}
        coverage={50}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );

    const card = container.querySelector<HTMLElement>(".ui-card");
    expect(card).toHaveClass("border-[var(--border-default)]");
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
