import { useCallback, useEffect, useRef, useState } from "react";
import {
  TRIVIA_LAYOUT_RESET_EVENT,
  TriviaLayout,
  TriviaPanelHeights,
  readTriviaLayout,
  writeTriviaLayout,
} from "../../../trivia/triviaLayout";
import { usePinnedPanelHeight } from "../../../components/trivia/hooks/usePinnedPanelHeight";
import {
  buildDeckBuilderPatch,
  buildSessionListPatch,
  buildSettingsPatch,
} from "../-triviaPageUtils";

export function useTriviaPageLayout() {
  const [layout, setLayout] = useState<TriviaLayout>(() => readTriviaLayout());
  const layoutRef = useRef<TriviaLayout>(layout);
  layoutRef.current = layout;

  useEffect(() => {
    const reload = () => setLayout(readTriviaLayout());
    window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, reload);
    return () => window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, reload);
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

  const sessionListPanel = usePinnedPanelHeight(
    layout.panelHeights.sessionList,
    applyPanelHeights,
    buildSessionListPatch,
  );
  const deckBuilderPanel = usePinnedPanelHeight(
    layout.panelHeights.deckBuilder,
    applyPanelHeights,
    buildDeckBuilderPatch,
  );
  const settingsPanel = usePinnedPanelHeight(
    layout.panelHeights.settings,
    applyPanelHeights,
    buildSettingsPatch,
  );

  return {
    layout,
    sessionListPanel,
    deckBuilderPanel,
    settingsPanel,
  };
}
