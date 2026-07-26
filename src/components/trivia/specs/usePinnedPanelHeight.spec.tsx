import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePinnedPanelHeight } from "../hooks/usePinnedPanelHeight";
import type { TriviaPanelHeights } from "../../../trivia/triviaLayout";

describe("usePinnedPanelHeight hook", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles nudge, restoreDefault, and drag callbacks", () => {
    const applySpy = vi.fn();
    const buildPatch = (val: number | null): Partial<TriviaPanelHeights> => ({ sessionList: val });

    const { result } = renderHook(() => usePinnedPanelHeight(100, applySpy, buildPatch));

    // Nudge when pinned is set
    act(() => {
      result.current.nudge(15);
    });
    expect(applySpy).toHaveBeenLastCalledWith({ sessionList: 115 }, true);

    // Restore default
    act(() => {
      result.current.restoreDefault();
    });
    expect(applySpy).toHaveBeenLastCalledWith({ sessionList: null }, true);
  });

  it("handles nudge fallback to bounding client rect when pinned is null", () => {
    const applySpy = vi.fn();
    const buildPatch = (val: number | null): Partial<TriviaPanelHeights> => ({ sessionList: val });

    const { result } = renderHook(() => usePinnedPanelHeight(null, applySpy, buildPatch));

    // Ref element height mock
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

    result.current.ref.current = mockElement;

    act(() => {
      result.current.nudge(20);
    });
    expect(applySpy).toHaveBeenLastCalledWith({ sessionList: 220 }, true);
  });

  it("handles mousemove and mouseup events during dragging", () => {
    const applySpy = vi.fn();
    const buildPatch = (val: number | null): Partial<TriviaPanelHeights> => ({ sessionList: val });

    const { result } = renderHook(() => usePinnedPanelHeight(100, applySpy, buildPatch));

    const mockElement = document.createElement("div");
    vi.spyOn(mockElement, "getBoundingClientRect").mockReturnValue({
      top: 50,
      bottom: 150,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 50,
      toJSON: () => {},
    });
    result.current.ref.current = mockElement;

    act(() => {
      result.current.setDragging(true);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 10, clientY: 150 }));
    });
    expect(applySpy).toHaveBeenLastCalledWith({ sessionList: 100 }, false); // 150 - 50 = 100

    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    expect(result.current.dragging).toBe(false);
    expect(applySpy).toHaveBeenLastCalledWith({ sessionList: 100 }, true);
  });
});
