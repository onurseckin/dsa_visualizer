import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMainLayoutState } from "../hooks/useMainLayoutState";
import { resetWorkspaceLayout, writeWorkspaceLayout } from "../../../app/workspaceLayout";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("useMainLayoutState hook", () => {
  it("initializes layout state and re-reads on WORKSPACE_LAYOUT_RESET_EVENT", () => {
    writeWorkspaceLayout({ splitPercent: 45 });
    const { result } = renderHook(() => useMainLayoutState());

    expect(result.current.layout.splitPercent).toBe(45);

    act(() => {
      resetWorkspaceLayout();
    });

    expect(result.current.layout.splitPercent).toBe(60);
  });

  it("toggles problem and solution panel expansion state", () => {
    const { result } = renderHook(() => useMainLayoutState());

    expect(result.current.problemExpanded).toBe(true);
    act(() => result.current.handleToggleProblemExpanded());
    expect(result.current.problemExpanded).toBe(false);

    expect(result.current.solutionExpanded).toBe(true);
    act(() => result.current.handleToggleSolutionExpanded());
    expect(result.current.solutionExpanded).toBe(false);
  });

  it("handles split change and split commit", () => {
    const { result } = renderHook(() => useMainLayoutState());

    act(() => result.current.handleSplitChange(50));
    expect(result.current.layout.splitPercent).toBe(50);

    act(() => result.current.handleSplitCommit(55));
    expect(result.current.layout.splitPercent).toBe(55);
  });

  it("applies panel heights and column heights with commit=true or commit=false", () => {
    const { result } = renderHook(() => useMainLayoutState());

    act(() => result.current.applyPanelHeights({ stage: 300 }, false));
    expect(result.current.layout.panelHeights.stage).toBe(300);

    act(() =>
      result.current.applyLeftHeights({ tutorial: 100, auxiliary: 120, visualizer: 200 }, true),
    );
    expect(result.current.layout.panelHeights.tutorial).toBe(100);
    expect(result.current.layout.panelHeights.auxiliary).toBe(120);

    act(() => result.current.applyRightHeights({ code: 400, complexity: 150 }, true));
    expect(result.current.layout.panelHeights.code).toBe(400);
    expect(result.current.layout.panelHeights.complexity).toBe(150);
  });

  it("handles stage, problem, and solution nudging and drag operations with/without refs", () => {
    const { result } = renderHook(() => useMainLayoutState());

    // Nudges with stageRef null starting from clamped 100
    act(() => result.current.applyPanelHeights({ stage: 100, problem: 100, solution: 100 }, false));

    act(() => result.current.nudgeStage(20));
    expect(result.current.layout.panelHeights.stage).toBe(120);

    act(() => result.current.nudgeProblem(30));
    expect(result.current.layout.panelHeights.problem).toBe(130);

    act(() => result.current.nudgeSolution(40));
    expect(result.current.layout.panelHeights.solution).toBe(140);

    // Test nudging when panelHeights stage/problem/solution are null and ref is set
    act(() =>
      result.current.applyPanelHeights({ stage: null, problem: null, solution: null }, false),
    );

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
      toJSON: () => ({}),
    });

    result.current.stageRef.current = mockElement;
    result.current.problemRef.current = mockElement;
    result.current.solutionRef.current = mockElement;

    act(() => result.current.nudgeStage(10));
    expect(result.current.layout.panelHeights.stage).toBe(210);

    act(() => result.current.nudgeProblem(10));
    expect(result.current.layout.panelHeights.problem).toBe(210);

    act(() => result.current.nudgeSolution(10));
    expect(result.current.layout.panelHeights.solution).toBe(210);

    // Drag state updaters & end drag
    act(() => result.current.setSolutionDragging(true));
    expect(result.current.solutionDragging).toBe(true);
    act(() => result.current.setSolutionDragging(false));
  });

  it("handles nudging when panelHeights and refs are both null (fallback to 0)", () => {
    const { result } = renderHook(() => useMainLayoutState());

    act(() =>
      result.current.applyPanelHeights({ stage: null, problem: null, solution: null }, false),
    );
    result.current.stageRef.current = null;
    result.current.problemRef.current = null;
    result.current.solutionRef.current = null;

    act(() => result.current.nudgeStage(50));
    expect(result.current.layout.panelHeights.stage).toBe(64); // clamped to MIN_PANEL_HEIGHT_PX (64)

    act(() => result.current.nudgeProblem(50));
    expect(result.current.layout.panelHeights.problem).toBe(64);

    act(() => result.current.nudgeSolution(50));
    expect(result.current.layout.panelHeights.solution).toBe(64);
  });

  it("handles dragging pointer movements with and without refs", () => {
    const { result } = renderHook(() => useMainLayoutState());

    // Drag stage with ref null and ref set
    result.current.stageRef.current = null;
    act(() => result.current.setStageDragging(true));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 200 }));
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

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
      toJSON: () => ({}),
    });

    result.current.stageRef.current = mockElement;
    act(() => result.current.setStageDragging(true));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 170 }));
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    result.current.problemRef.current = mockElement;

    act(() => result.current.setProblemDragging(true));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 180 }));
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });

    expect(result.current.problemDragging).toBe(false);

    // Drag solution with ref set and null
    result.current.solutionRef.current = mockElement;
    act(() => result.current.setSolutionDragging(true));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 190 }));
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    expect(result.current.solutionDragging).toBe(false);

    result.current.solutionRef.current = null;
    act(() => result.current.setSolutionDragging(true));
    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 190 }));
    });
    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
  });
});
