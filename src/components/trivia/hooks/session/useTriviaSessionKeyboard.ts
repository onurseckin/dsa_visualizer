import { useEffect, useRef } from "react";

interface KeyHandlers {
  currentTargetLine: number | null;
  graded: boolean;
  allFilled: boolean;
  selectedTileId: string | null;
  handleRetry: () => void;
  handleReveal: (line: number) => void;
  toggleHint: (line: number) => void;
  handleNext: () => void;
  handleCheck: () => void;
  setSelectedTileId: (id: string | null) => void;
}

export function useTriviaSessionKeyboard(handlers: KeyHandlers) {
  const keyHandlersRef = useRef(handlers);
  keyHandlersRef.current = handlers;

  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent): void => {
      const {
        currentTargetLine: target,
        graded: isGraded,
        allFilled: isComplete,
        selectedTileId: selTile,
        handleRetry: doRetry,
        handleReveal: doReveal,
        toggleHint: doHint,
        handleNext: doNext,
        handleCheck: doCheck,
        setSelectedTileId: setSelTile,
      } = keyHandlersRef.current;

      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (meta && key === "r") {
        e.preventDefault();
        doRetry();
        return;
      }
      if (e.altKey && key === "e") {
        e.preventDefault();
        if (target !== null) doReveal(target);
        return;
      }
      if (meta && (key === "h" || key === "i")) {
        e.preventDefault();
        if (target !== null) doHint(target);
        return;
      }
      if (meta && e.key === "Enter") {
        e.preventDefault();
        if (isGraded) {
          doNext();
        } else if (isComplete) {
          doCheck();
        }
        return;
      }
      if (e.key === "Escape" && selTile !== null) {
        setSelTile(null);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);
}
