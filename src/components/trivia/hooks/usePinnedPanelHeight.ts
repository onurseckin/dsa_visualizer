import { useCallback, useRef, useState } from "react";
import { usePointerDrag } from "../../../ui";
import type { TriviaPanelHeights } from "../../../trivia/triviaLayout";

export function usePinnedPanelHeight(
  pinned: number | null,
  applyPanelHeights: (patch: Partial<TriviaPanelHeights>, commit: boolean) => void,
  buildPatch: (value: number | null) => Partial<TriviaPanelHeights>,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const dragTo = useCallback(
    (_x: number, y: number) => {
      const top = ref.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      applyPanelHeights(buildPatch(y - top), false);
    },
    [applyPanelHeights, buildPatch],
  );

  const endDrag = useCallback(() => {
    setDragging(false);
    applyPanelHeights(buildPatch(pinnedRef.current), true);
  }, [applyPanelHeights, buildPatch]);

  usePointerDrag(dragging, dragTo, endDrag);

  const nudge = useCallback(
    (delta: number) => {
      const current = pinnedRef.current ?? ref.current?.getBoundingClientRect().height ?? 0;
      applyPanelHeights(buildPatch(current + delta), true);
    },
    [applyPanelHeights, buildPatch],
  );

  const restoreDefault = useCallback(() => {
    applyPanelHeights(buildPatch(null), true);
  }, [applyPanelHeights, buildPatch]);

  return { ref, dragging, setDragging, nudge, restoreDefault };
}
