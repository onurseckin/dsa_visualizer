import type { TriviaMode, TriviaRound } from "../../../types/trivia";
import { useSessionLayoutState } from "./session/useSessionLayoutState";
import { useSessionSlotState } from "./session/useSessionSlotState";
import { useTriviaSessionKeyboard } from "./session/useTriviaSessionKeyboard";

interface UseTriviaSessionStateProps {
  round: TriviaRound;
  mode: TriviaMode;
  onSubmit: (answers: Record<number, string>) => void;
  onNext: () => void;
}

export function useTriviaSessionState({
  round,
  mode,
  onSubmit,
  onNext,
}: UseTriviaSessionStateProps) {
  const layoutState = useSessionLayoutState();
  const slotState = useSessionSlotState({ round, mode, onSubmit });

  useTriviaSessionKeyboard({
    currentTargetLine: slotState.currentTargetLine,
    graded: slotState.graded,
    allFilled: slotState.allFilled,
    selectedTileId: slotState.selectedTileId,
    handleRetry: slotState.handleRetry,
    handleReveal: slotState.handleReveal,
    toggleHint: slotState.toggleHint,
    handleNext: onNext,
    handleCheck: slotState.handleCheck,
    setSelectedTileId: slotState.setSelectedTileId,
  });

  return {
    ...layoutState,
    ...slotState,
    handleNext: onNext,
  };
}
