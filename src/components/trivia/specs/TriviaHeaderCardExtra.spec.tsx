import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaHeaderCard } from "../TriviaHeaderCard";
import type { TriviaSessionRecord } from "../../../types/trivia";
import { DEFAULT_TRIVIA_CONFIG } from "../../../trivia/triviaEngine";

describe("TriviaHeaderCard extra coverage", () => {
  const sampleSession: TriviaSessionRecord = {
    id: "s-header",
    name: "Header Session",
    createdAt: 1000,
    updatedAt: 2000,
    config: { ...DEFAULT_TRIVIA_CONFIG, minBlanks: 1, maxBlanks: 2 },
    progress: { level: 1, drilled: {}, stats: {}, completed: false, roundsPlayed: 1 },
    lastScreen: "setup",
  };

  it("supports inline title editing with Save and Cancel", () => {
    const onRenameSession = vi.fn();
    render(
      <TriviaHeaderCard
        activeSession={sampleSession}
        level={1}
        config={sampleSession.config}
        progress={sampleSession.progress}
        sourcesCount={1}
        coverage={100}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={onRenameSession}
        deckLineCounts={[3, 5]}
        onChangeSettings={vi.fn()}
      />,
    );

    const renameBtn = screen.getByRole("button", { name: "Rename Header Session" });
    fireEvent.click(renameBtn);

    const input = screen.getByRole("textbox", { name: "Rename active session" });
    expect(input).toHaveValue("Header Session");

    // Cancel rename via Escape
    fireEvent.keyDown(input, { key: "Escape" });
    expect(
      screen.queryByRole("textbox", { name: "Rename active session" }),
    ).not.toBeInTheDocument();

    // Start rename again & save with button
    fireEvent.click(screen.getByRole("button", { name: "Rename Header Session" }));
    const input2 = screen.getByRole("textbox", { name: "Rename active session" });
    fireEvent.change(input2, { target: { value: "New Header Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save session name" }));
    expect(onRenameSession).toHaveBeenCalledWith("s-header", "New Header Name");
  });

  it("displays singular badges for 1 algorithm and 1 round", () => {
    render(
      <TriviaHeaderCard
        activeSession={sampleSession}
        level={1}
        config={{ ...DEFAULT_TRIVIA_CONFIG, minBlanks: 1, maxBlanks: 2 }}
        progress={{ level: 1, drilled: {}, stats: {}, completed: false, roundsPlayed: 1 }}
        sourcesCount={1}
        coverage={100}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[4]}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("1 round")).toBeInTheDocument();
    expect(screen.getByText("1 algorithm")).toBeInTheDocument();
    expect(screen.getByText("1–2 blanks")).toBeInTheDocument();
    expect(screen.getByText("Deck lines: 4–4")).toBeInTheDocument();
  });

  it("supports Enter key to submit rename and handles empty deck line counts", () => {
    const onRenameSession = vi.fn();
    render(
      <TriviaHeaderCard
        activeSession={sampleSession}
        level={1}
        config={sampleSession.config}
        progress={sampleSession.progress}
        sourcesCount={0}
        coverage={0}
        isDeckEmpty={true}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={onRenameSession}
        deckLineCounts={[]}
        onChangeSettings={vi.fn()}
      />,
    );

    expect(screen.getByText("Deck lines: —")).toBeInTheDocument();

    const renameBtn = screen.getByRole("button", { name: "Rename Header Session" });
    fireEvent.click(renameBtn);

    const input = screen.getByRole("textbox", { name: "Rename active session" });
    fireEvent.change(input, { target: { value: "Renamed Session" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onRenameSession).toHaveBeenCalledWith("s-header", "Renamed Session");
  });

  it("displays a multi-level blanks span", () => {
    render(
      <TriviaHeaderCard
        activeSession={sampleSession}
        level={2}
        config={{ ...DEFAULT_TRIVIA_CONFIG, minBlanks: 2, maxBlanks: 3 }}
        progress={sampleSession.progress}
        sourcesCount={1}
        coverage={100}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[5]}
        onChangeSettings={vi.fn()}
      />,
    );
    expect(screen.getByText("2–3 blanks")).toBeInTheDocument();
  });

  it("handles cancel rename button, empty input saving, missing onRenameSession, and key events", () => {
    const onRenameSession = vi.fn();

    // 1. Render without onRenameSession
    const { rerender } = render(
      <TriviaHeaderCard
        activeSession={sampleSession}
        level={1}
        config={sampleSession.config}
        progress={sampleSession.progress}
        sourcesCount={1}
        coverage={100}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        deckLineCounts={[3]}
        onChangeSettings={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /Rename/i })).not.toBeInTheDocument();

    // 2. Rerender with onRenameSession and test Cancel button + empty input + random key
    rerender(
      <TriviaHeaderCard
        activeSession={sampleSession}
        level={1}
        config={sampleSession.config}
        progress={sampleSession.progress}
        sourcesCount={1}
        coverage={100}
        isDeckEmpty={false}
        onStartDrilling={vi.fn()}
        onBackToHome={vi.fn()}
        onRenameSession={onRenameSession}
        deckLineCounts={[3]}
        onChangeSettings={vi.fn()}
      />,
    );

    // Click rename button
    fireEvent.click(screen.getByRole("button", { name: "Rename Header Session" }));
    const input = screen.getByRole("textbox", { name: "Rename active session" });

    // KeyDown random key (e.g., 'a') should do nothing
    fireEvent.keyDown(input, { key: "a" });
    expect(input).toBeInTheDocument();

    // Click Cancel rename button
    fireEvent.click(screen.getByRole("button", { name: "Cancel rename" }));
    expect(
      screen.queryByRole("textbox", { name: "Rename active session" }),
    ).not.toBeInTheDocument();

    // Start rename again, clear input (empty space), and save
    fireEvent.click(screen.getByRole("button", { name: "Rename Header Session" }));
    const input2 = screen.getByRole("textbox", { name: "Rename active session" });
    fireEvent.change(input2, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Save session name" }));

    // onRenameSession should NOT be called for whitespace input
    expect(onRenameSession).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "Rename active session" }),
    ).not.toBeInTheDocument();
  });
});
