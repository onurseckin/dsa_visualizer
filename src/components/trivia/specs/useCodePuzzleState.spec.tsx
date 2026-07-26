import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCodePuzzleState } from "../hooks/useCodePuzzleState";
import type { TriviaRound } from "../../../types/trivia";

const testRound: TriviaRound = {
  algorithmId: "two-sum",
  level: 1,
  lines: [
    {
      number: 1,
      text: "def two_sum(nums, target):",
      indent: "",
      content: "def two_sum(nums, target):",
      blankable: true,
    },
    { number: 2, text: "    seen = {}", indent: "    ", content: "seen = {}", blankable: true },
  ],
  blanks: [2],
  tiles: [{ id: "t2", text: "seen = {}", correctFor: 2 }],
};

describe("useCodePuzzleState hook", () => {
  it("manages auto-focus, internal hint state, explanation clicks, and truth resolution", async () => {
    const inputElement = document.createElement("input");
    const focusSpy = vi.spyOn(inputElement, "focus");

    const hints = [{ line: 2, hint: "Store seen values" }];
    const lineExplanations = { 2: "Line 2 explanation" };

    const { result } = renderHook(() =>
      useCodePuzzleState({
        round: testRound,
        mode: "type",
        graded: false,
        hints,
        lineExplanations,
      }),
    );

    // Set input ref for line 2
    result.current.inputRefs.current.set(2, inputElement);

    // Wait for auto-focus timer (50ms in hook)
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(focusSpy).toHaveBeenCalled();

    // Internal hint toggling (no onToggleHint prop provided)
    expect(result.current.openHintsSet.has(2)).toBe(false);
    act(() => {
      result.current.toggleHint(2);
    });
    expect(result.current.openHintsSet.has(2)).toBe(true);
    act(() => {
      result.current.toggleHint(2);
    });
    expect(result.current.openHintsSet.has(2)).toBe(false);

    // Test hintFor, explanationFor, truthFor helpers
    expect(result.current.hintFor(2)).toBe("Store seen values");
    expect(result.current.explanationFor(2)).toBe("Line 2 explanation");
    expect(result.current.truthFor(2)).toBe("seen = {}");
    expect(result.current.truthFor(99)).toBe("");

    // Handle explain click
    const mockButton = document.createElement("button");
    vi.spyOn(mockButton, "getBoundingClientRect").mockReturnValue({
      top: 10,
      bottom: 20,
      left: 10,
      right: 30,
      width: 20,
      height: 10,
      x: 10,
      y: 10,
      toJSON: () => {},
    });
    const clickEvent = {
      currentTarget: mockButton,
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    act(() => {
      result.current.handleExplainClick(2, clickEvent);
    });
    expect(result.current.clickedExplain).toEqual({
      line: 2,
      rect: expect.any(Object),
    });
    expect(result.current.clickedExplanation).toBe("Line 2 explanation");

    // Click same line again -> toggles clickedExplain to null
    act(() => {
      result.current.handleExplainClick(2, clickEvent);
    });
    expect(result.current.clickedExplain).toBeNull();
    expect(result.current.clickedExplanation).toBeUndefined();

    // Toggle hint with onToggleHint prop provided
    const onToggleHint = vi.fn();
    const { result: propResult } = renderHook(() =>
      useCodePuzzleState({
        round: testRound,
        mode: "choice",
        graded: false,
        onToggleHint,
      }),
    );
    act(() => {
      propResult.current.toggleHint(2);
    });
    expect(onToggleHint).toHaveBeenCalledWith(2);
  });
});
