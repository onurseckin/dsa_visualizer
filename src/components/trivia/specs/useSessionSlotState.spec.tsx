import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSessionSlotState } from "../hooks/session/useSessionSlotState";
import type { TriviaMode, TriviaRound } from "../../../types/trivia";

const testRound: TriviaRound = {
  algorithmId: "two-sum",
  level: 2,
  lines: [
    {
      number: 1,
      text: "def two_sum(nums, target):",
      indent: "",
      content: "def two_sum(nums, target):",
      blankable: true,
    },
    { number: 2, text: "    seen = {}", indent: "    ", content: "seen = {}", blankable: true },
    { number: 3, text: "    return []", indent: "    ", content: "return []", blankable: true },
  ],
  blanks: [2, 3],
  tiles: [
    { id: "t2", text: "seen = {}", correctFor: 2 },
    { id: "t3", text: "return []", correctFor: 3 },
  ],
};

describe("useSessionSlotState hook", () => {
  it("handles complete lifecycle of placement, typing, revealing, checking, and retry", () => {
    const onSubmit = vi.fn();
    const { result, rerender } = renderHook(
      ({ round, mode }: { round: TriviaRound; mode: TriviaMode }) =>
        useSessionSlotState({ round, mode, onSubmit }),
      { initialProps: { round: testRound, mode: "choice" as TriviaMode } },
    );

    // Initial state
    expect(result.current.allFilled).toBe(false);
    expect(result.current.currentTargetLine).toBe(2);

    // Select tile t2
    act(() => {
      result.current.handleSelectTile("t2");
    });
    expect(result.current.selectedTileId).toBe("t2");

    // Deselect tile t2
    act(() => {
      result.current.handleSelectTile("t2");
    });
    expect(result.current.selectedTileId).toBeNull();

    // Activate tile t2 -> places in line 2
    act(() => {
      result.current.handleActivateTile("t2");
    });
    expect(result.current.filledAnswers[2]).toBe("seen = {}");
    expect(result.current.currentTargetLine).toBe(3);

    // Activate tile t3 -> places in line 3
    act(() => {
      result.current.handleActivateTile("t3");
    });
    expect(result.current.filledAnswers[3]).toBe("return []");
    expect(result.current.allFilled).toBe(true);

    // Activating a tile when all blanks are filled toggles selection
    act(() => {
      result.current.handleActivateTile("t2");
    });
    expect(result.current.selectedTileId).toBe("t2");
    act(() => {
      result.current.setSelectedTileId(null);
    });

    // Check answers
    act(() => {
      result.current.handleCheck();
    });
    expect(result.current.graded).toBe(true);
    expect(result.current.correctCount).toBe(2);
    expect(onSubmit).toHaveBeenCalled();

    // When graded, early returns on actions
    act(() => {
      result.current.placeTile(2, "t2");
      result.current.handleSlotActivate(2);
      result.current.handleSelectTile("t3");
      result.current.handleActivateTile("t3");
      result.current.handleTypeAnswer(2, "new text");
      result.current.handleReveal(2);
      result.current.handleCheck();
    });

    // Retry resets state
    act(() => {
      result.current.handleRetry();
    });
    expect(result.current.graded).toBe(false);

    // Test mode change resets state
    rerender({ round: testRound, mode: "type" as const });
    expect(result.current.modeDescription).toBeDefined();

    // Type answer
    act(() => {
      result.current.handleTypeAnswer(2, "seen = {}");
    });
    expect(result.current.filledAnswers[2]).toBe("seen = {}");

    // Slot activate with filled text clears slot
    act(() => {
      result.current.handleSlotActivate(2);
    });
    expect(result.current.filledAnswers[2]).toBeUndefined();

    // Reveal line 2
    act(() => {
      result.current.handleReveal(2);
    });
    expect(result.current.revealed).toContain(2);

    // Reveal line 2 again (already in revealed set)
    act(() => {
      result.current.handleReveal(2);
    });
    expect(result.current.revealed).toHaveLength(1);

    // Toggle hint
    act(() => {
      result.current.toggleHint(2);
    });
    expect(result.current.openHints).toContain(2);
    act(() => {
      result.current.toggleHint(2);
    });
    expect(result.current.openHints).not.toContain(2);

    // Invalid tileId in placeTile returns early
    act(() => {
      result.current.placeTile(2, "invalid-tile-id");
    });
    expect(result.current.filledAnswers[2]).toBe("seen = {}");
  });

  it("handles empty blanks array (round with no blanks)", () => {
    const emptyRound: TriviaRound = {
      ...testRound,
      blanks: [],
    };
    const { result } = renderHook(() =>
      useSessionSlotState({ round: emptyRound, mode: "choice", onSubmit: vi.fn() }),
    );

    expect(result.current.currentTargetLine).toBeNull();
  });
});
