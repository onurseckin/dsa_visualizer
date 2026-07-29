import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WorkspaceLayout,
  WorkspacePanelHeights,
  readWorkspaceLayout,
  writeWorkspaceLayout,
} from "../../../app/workspaceLayout";
import { PanelHeightMap, usePointerDrag } from "../../../ui";

export function useMainLayoutState(algorithmId?: string) {
  const [layout, setLayout] = useState<WorkspaceLayout>(() => readWorkspaceLayout(algorithmId));
  const problemExpanded = layout.problemExpanded;
  const solutionExpanded = layout.solutionExpanded;

  const layoutRef = useRef<WorkspaceLayout>(layout);
  layoutRef.current = layout;

  useEffect(() => {
    setLayout(readWorkspaceLayout(algorithmId));
  }, [algorithmId]);

  useEffect(() => {
    const reload = (event?: Event) => {
      const customEvent = event as CustomEvent<{ algorithmId?: string }> | undefined;
      const targetId = customEvent?.detail?.algorithmId;
      if (!targetId || targetId === algorithmId) {
        setLayout(readWorkspaceLayout(algorithmId));
      }
    };
    window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, reload);
    return () => window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, reload);
  }, [algorithmId]);

  const handleToggleProblemExpanded = useCallback(() => {
    setLayout(
      writeWorkspaceLayout(
        { problemExpanded: !layoutRef.current.problemExpanded },
        algorithmId,
      ),
    );
  }, [algorithmId]);

  const handleToggleSolutionExpanded = useCallback(() => {
    setLayout(
      writeWorkspaceLayout(
        { solutionExpanded: !layoutRef.current.solutionExpanded },
        algorithmId,
      ),
    );
  }, [algorithmId]);

  const handleSplitChange = useCallback((percent: number) => {
    setLayout((prev) => ({ ...prev, splitPercent: percent }));
  }, []);

  const handleSplitCommit = useCallback(
    (percent: number) => {
      setLayout(
        writeWorkspaceLayout(
          {
            splitPercent: percent,
            panelHeights: layoutRef.current.panelHeights,
          },
          algorithmId,
        ),
      );
    },
    [algorithmId],
  );

  const applyPanelHeights = useCallback(
    (patch: Partial<WorkspacePanelHeights>, commit: boolean) => {
      if (!commit) {
        setLayout((prev) => ({ ...prev, panelHeights: { ...prev.panelHeights, ...patch } }));
        return;
      }
      setLayout(
        writeWorkspaceLayout(
          {
            splitPercent: layoutRef.current.splitPercent,
            panelHeights: { ...layoutRef.current.panelHeights, ...patch },
          },
          algorithmId,
        ),
      );
    },
    [algorithmId],
  );

  const applyLeftHeights = useCallback(
    (heights: PanelHeightMap, commit: boolean) => {
      applyPanelHeights(
        {
          tutorial: heights.tutorial ?? null,
          visualizer: heights.visualizer ?? null,
        },
        commit,
      );
    },
    [applyPanelHeights],
  );

  const applyRightHeights = useCallback(
    (heights: PanelHeightMap, commit: boolean) => {
      applyPanelHeights(
        { code: heights.code ?? null, complexity: heights.complexity ?? null },
        commit,
      );
    },
    [applyPanelHeights],
  );

  // Stage pinning drag
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageDragging, setStageDragging] = useState(false);
  const stagePinned = layout.panelHeights.stage;

  const nudgeStage = useCallback(
    (delta: number) => {
      const current =
        layoutRef.current.panelHeights.stage ??
        stageRef.current?.getBoundingClientRect().height ??
        0;
      applyPanelHeights({ stage: current + delta }, true);
    },
    [applyPanelHeights],
  );

  const dragStageTo = useCallback(
    (_x: number, y: number) => {
      const top = stageRef.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      applyPanelHeights({ stage: y - top }, false);
    },
    [applyPanelHeights],
  );

  const endStageDrag = useCallback(() => {
    setStageDragging(false);
    applyPanelHeights({ stage: layoutRef.current.panelHeights.stage }, true);
  }, [applyPanelHeights]);

  usePointerDrag(stageDragging, dragStageTo, endStageDrag);

  // Problem pinning drag
  const problemRef = useRef<HTMLDivElement | null>(null);
  const [problemDragging, setProblemDragging] = useState(false);
  const problemPinned = layout.panelHeights.problem;

  const nudgeProblem = useCallback(
    (delta: number) => {
      const current =
        layoutRef.current.panelHeights.problem ??
        problemRef.current?.getBoundingClientRect().height ??
        0;
      applyPanelHeights({ problem: current + delta }, true);
    },
    [applyPanelHeights],
  );

  const dragProblemTo = useCallback(
    (_x: number, y: number) => {
      const top = problemRef.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      applyPanelHeights({ problem: y - top }, false);
    },
    [applyPanelHeights],
  );

  const endProblemDrag = useCallback(() => {
    setProblemDragging(false);
    applyPanelHeights({ problem: layoutRef.current.panelHeights.problem }, true);
  }, [applyPanelHeights]);

  usePointerDrag(problemDragging, dragProblemTo, endProblemDrag);

  // Solution pinning drag
  const solutionRef = useRef<HTMLDivElement | null>(null);
  const [solutionDragging, setSolutionDragging] = useState(false);
  const solutionPinned = layout.panelHeights.solution;

  const nudgeSolution = useCallback(
    (delta: number) => {
      const current =
        layoutRef.current.panelHeights.solution ??
        solutionRef.current?.getBoundingClientRect().height ??
        0;
      applyPanelHeights({ solution: current + delta }, true);
    },
    [applyPanelHeights],
  );

  const dragSolutionTo = useCallback(
    (_x: number, y: number) => {
      const top = solutionRef.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      applyPanelHeights({ solution: y - top }, false);
    },
    [applyPanelHeights],
  );

  const endSolutionDrag = useCallback(() => {
    setSolutionDragging(false);
    applyPanelHeights({ solution: layoutRef.current.panelHeights.solution }, true);
  }, [applyPanelHeights]);

  usePointerDrag(solutionDragging, dragSolutionTo, endSolutionDrag);

  return {
    layout,
    problemExpanded,
    solutionExpanded,
    handleToggleProblemExpanded,
    handleToggleSolutionExpanded,
    handleSplitChange,
    handleSplitCommit,
    applyPanelHeights,
    applyLeftHeights,
    applyRightHeights,
    stageRef,
    stagePinned,
    stageDragging,
    setStageDragging,
    nudgeStage,
    problemRef,
    problemPinned,
    problemDragging,
    setProblemDragging,
    nudgeProblem,
    solutionRef,
    solutionPinned,
    solutionDragging,
    setSolutionDragging,
    nudgeSolution,
    defaultSplitPercent: DEFAULT_WORKSPACE_LAYOUT.splitPercent,
    minSplitPercent: MIN_SPLIT_PERCENT,
    maxSplitPercent: MAX_SPLIT_PERCENT,
    minPanelHeightPx: MIN_PANEL_HEIGHT_PX,
    maxPanelHeightPx: MAX_PANEL_HEIGHT_PX,
  };
}

export type MainLayoutState = ReturnType<typeof useMainLayoutState>;
