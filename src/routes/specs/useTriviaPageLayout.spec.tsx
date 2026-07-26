import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTriviaPageLayout } from "../trivia/-hooks/useTriviaPageLayout";
import { resetTriviaLayout, writeTriviaLayout } from "../../trivia/triviaLayout";

describe("useTriviaPageLayout hook", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("loads layout and updates when TRIVIA_LAYOUT_RESET_EVENT fires", () => {
    writeTriviaLayout({ puzzleSplitPercent: 55 });
    const { result } = renderHook(() => useTriviaPageLayout());

    expect(result.current.layout.puzzleSplitPercent).toBe(55);

    act(() => {
      resetTriviaLayout();
    });

    expect(result.current.layout.puzzleSplitPercent).toBe(65);
  });

  it("supports uncommitted and committed panel height changes", () => {
    const { result } = renderHook(() => useTriviaPageLayout());

    const mockElement = document.createElement("div");
    vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
      top: 50,
      bottom: 250,
      left: 0,
      right: 100,
      width: 100,
      height: 200,
      x: 0,
      y: 50,
      toJSON: () => {},
    });
    result.current.sessionListPanel.ref.current = mockElement;

    // Drag uncommitted
    act(() => {
      result.current.sessionListPanel.setDragging(true);
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientY: 150 }));
    });
    expect(result.current.layout.panelHeights.sessionList).not.toBeNull();

    act(() => {
      result.current.sessionListPanel.nudge(20);
    });
    expect(result.current.layout.panelHeights.sessionList).not.toBeNull();

    // Restore default
    act(() => {
      result.current.sessionListPanel.restoreDefault();
    });
    expect(result.current.layout.panelHeights.sessionList).toBeNull();
  });
});
