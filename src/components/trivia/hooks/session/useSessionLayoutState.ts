import { useCallback, useEffect, useRef, useState } from "react";
import {
  TRIVIA_LAYOUT_RESET_EVENT,
  TriviaLayout,
  TriviaPanelHeights,
  readTriviaLayout,
  writeTriviaLayout,
} from "../../../../trivia/triviaLayout";
import { usePinnedPanelHeight } from "../usePinnedPanelHeight";
import { buildProblemPatch, buildPuzzlePatch } from "./sessionUtils";

export function useSessionLayoutState() {
  const [layout, setLayout] = useState<TriviaLayout>(() => readTriviaLayout());
  const layoutRef = useRef<TriviaLayout>(layout);
  layoutRef.current = layout;
  const problemExpanded = layout.problemExpanded;

  useEffect(() => {
    const reload = () => setLayout(readTriviaLayout());
    window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, reload);
    return () => window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, reload);
  }, []);

  const handleToggleProblemExpanded = useCallback(() => {
    setLayout(writeTriviaLayout({ problemExpanded: !layoutRef.current.problemExpanded }));
  }, []);

  const applyPanelHeights = useCallback((patch: Partial<TriviaPanelHeights>, commit: boolean) => {
    if (!commit) {
      setLayout((prev) => ({ ...prev, panelHeights: { ...prev.panelHeights, ...patch } }));
      return;
    }
    setLayout(
      writeTriviaLayout({
        puzzleSplitPercent: layoutRef.current.puzzleSplitPercent,
        panelHeights: { ...layoutRef.current.panelHeights, ...patch },
      }),
    );
  }, []);

  const handleSplitChange = useCallback((percent: number) => {
    setLayout((prev) => ({ ...prev, puzzleSplitPercent: percent }));
  }, []);

  const handleSplitCommit = useCallback((percent: number) => {
    setLayout(
      writeTriviaLayout({
        puzzleSplitPercent: percent,
        panelHeights: layoutRef.current.panelHeights,
      }),
    );
  }, []);

  const problemPanel = usePinnedPanelHeight(
    layout.panelHeights.problem,
    applyPanelHeights,
    buildProblemPatch,
  );
  const puzzlePanel = usePinnedPanelHeight(
    layout.panelHeights.puzzle,
    applyPanelHeights,
    buildPuzzlePatch,
  );

  return {
    layout,
    problemExpanded,
    handleToggleProblemExpanded,
    handleSplitChange,
    handleSplitCommit,
    problemPanel,
    puzzlePanel,
  };
}
