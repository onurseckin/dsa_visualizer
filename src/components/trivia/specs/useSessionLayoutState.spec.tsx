import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionLayoutState } from "../hooks/session/useSessionLayoutState";
import { resetTriviaLayout } from "../../../trivia/triviaLayout";

describe("useSessionLayoutState hook", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("manages problemExpanded toggle, split change/commit, and reset events", () => {
    const { result } = renderHook(() => useSessionLayoutState());

    expect(result.current.problemExpanded).toBe(true);

    act(() => {
      result.current.handleToggleProblemExpanded();
    });
    expect(result.current.problemExpanded).toBe(false);

    act(() => {
      result.current.handleSplitChange(50);
    });
    expect(result.current.layout.puzzleSplitPercent).toBe(50);

    act(() => {
      result.current.handleSplitCommit(55);
    });
    expect(result.current.layout.puzzleSplitPercent).toBe(55);

    const div = document.createElement("div");
    div.getBoundingClientRect = () => new DOMRect(0, 100, 400, 200);
    result.current.problemPanel.ref.current = div;

    act(() => {
      div.dispatchEvent(new MouseEvent("mousedown", { clientY: 200 }));
      result.current.problemPanel.setDragging(true);
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientY: 250 }));
    });

    act(() => {
      result.current.problemPanel.nudge(20);
    });
    expect(result.current.layout.panelHeights.problem).not.toBeNull();

    act(() => {
      result.current.puzzlePanel.restoreDefault();
    });
    expect(result.current.layout.panelHeights.puzzle).toBeNull();

    // Reset event reloads layout
    act(() => {
      resetTriviaLayout();
    });
    expect(result.current.layout.puzzleSplitPercent).toBe(65);
    expect(result.current.problemExpanded).toBe(true);
  });
});
