import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaHeaderCard } from "../TriviaHeaderCard";
import { DEFAULT_TRIVIA_CONFIG, createProgress } from "../../../trivia/triviaEngine";

describe("TriviaHeaderCard - Navigation & Actions", () => {
  const config = DEFAULT_TRIVIA_CONFIG;
  const progress = createProgress(config);
  const DECK_LINE_COUNTS = [7, 2, 15];

  it('renders the unambiguous "Back to Trivia Home" exit (TASKS.md 9.1) and fires it on click', () => {
    const onBackToHome = vi.fn();

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
        onBackToHome={onBackToHome}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );

    const homeBtn = screen.getByRole("button", { name: "Back to Trivia Home" });
    fireEvent.click(homeBtn);
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });

  it("never renders a ghost-variant button anywhere on the card (9.5)", () => {
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
        onRenameSession={vi.fn()}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );

    screen.getAllByRole("button").forEach((button) => {
      expect(button.className).not.toMatch(/ui-btn--ghost/);
    });
  });

  it("supports inline session renaming when onRenameSession is provided", () => {
    const onRenameSession = vi.fn();

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
        onRenameSession={onRenameSession}
        deckLineCounts={DECK_LINE_COUNTS}
        onChangeSettings={vi.fn()}
      />,
    );

    const renameBtn = screen.getByRole("button", { name: "Rename Session 1" });
    fireEvent.click(renameBtn);

    const input = screen.getByLabelText("Rename active session");
    fireEvent.change(input, { target: { value: "My Custom Deck" } });

    const saveBtn = screen.getByRole("button", { name: "Save session name" });
    fireEvent.click(saveBtn);

    expect(onRenameSession).toHaveBeenCalledWith("s1", "My Custom Deck");
  });
});
