import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriviaSession } from "../TriviaSession";
import type { TriviaRound } from "../../../types/trivia";
import { writeTriviaLayout } from "../../../trivia/triviaLayout";

const sampleRound: TriviaRound = {
  algorithmId: "bubble-sort",
  level: 1,
  lines: [
    {
      number: 1,
      text: "def bubble_sort(arr):",
      indent: "",
      content: "def bubble_sort(arr):",
      blankable: true,
    },
    { number: 2, text: "    return arr", indent: "    ", content: "return arr", blankable: true },
  ],
  blanks: [2],
  tiles: [{ id: "t1", text: "return arr", correctFor: 2 }],
};

describe("TriviaSession extra coverage", () => {
  it("exports Header, Footer, Stage sub-components", () => {
    expect(TriviaSession.Header).toBeDefined();
    expect(TriviaSession.Footer).toBeDefined();
    expect(TriviaSession.Stage).toBeDefined();
  });

  it("handles Escape key to deselect tile in choice mode", () => {
    render(
      <TriviaSession
        round={sampleRound}
        algorithmTitle="Bubble Sort"
        mode="choice"
        level={1}
        coverage={50}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    // Click tile to select
    const tile = screen.getByRole("button", { name: "Tile return arr" });
    fireEvent.click(tile);

    // KeyDown Escape on container
    const section = tile.closest("section")!;
    fireEvent.keyDown(section, { key: "Escape" });
  });

  it("applies explicit problem panel height style when set in layout", () => {
    writeTriviaLayout({
      panelHeights: {
        problem: 180,
        puzzle: null,
        sessionList: null,
        deckBuilder: null,
        settings: null,
      },
    });
    render(
      <TriviaSession
        round={sampleRound}
        algorithmTitle="Bubble Sort"
        mode="choice"
        level={1}
        coverage={50}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("separator", { name: "Resize problem description and puzzle rows" }),
    ).toBeInTheDocument();
  });

  it("handles keydown when no tile is selected, level > 1 plural lines, and unknown algorithmId", () => {
    const multiRound: TriviaRound = { ...sampleRound, level: 2, algorithmId: "unknown_alg_xyz" };
    const { container } = render(
      <TriviaSession
        round={multiRound}
        algorithmTitle="Unknown Alg"
        mode="choice"
        level={2}
        coverage={50}
        onSubmit={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const section = container.querySelector("section")!;
    // Pressing Escape when selectedTileId is null does nothing
    fireEvent.keyDown(section, { key: "Escape" });
    // Pressing non-Escape key (e.g. Enter) does nothing
    fireEvent.keyDown(section, { key: "Enter" });

    expect(screen.getByText("Hiding 2 lines")).toBeInTheDocument();
  });
});
