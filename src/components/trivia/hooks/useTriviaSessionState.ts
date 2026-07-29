import type { TriviaMode, TriviaReviewSubmission, TriviaRound } from "../../../types/trivia";
import { useSessionLayoutState } from "./session/useSessionLayoutState";
import { useSessionSlotState } from "./session/useSessionSlotState";
import { useTriviaSessionKeyboard } from "./session/useTriviaSessionKeyboard";

interface UseTriviaSessionStateProps {
  round: TriviaRound;
  mode: TriviaMode;
  onSubmit: (answers: Record<number, string>) => void;
  onReview?: (submission: TriviaReviewSubmission) => void;
  onNext: () => void;
}

export function useTriviaSessionState({
  round,
  mode,
  onSubmit,
  onReview,
  onNext,
}: UseTriviaSessionStateProps) {
  const layoutState = useSessionLayoutState();
  const slotState = useSessionSlotState({ round, mode, onSubmit });
  const reviewRequired = slotState.graded && round.retrievalPrompt !== undefined;
  const reviewComplete =
    !reviewRequired ||
    (slotState.confidence !== null && slotState.reviewResponse.trim().length > 0);
  const handleNext = (): void => {
    if (!reviewComplete) return;
    if (reviewRequired && slotState.confidence !== null) {
      onReview?.({
        confidence: slotState.confidence,
        response: slotState.reviewResponse.trim(),
      });
    }
    onNext();
  };

  useTriviaSessionKeyboard({
    currentTargetLine: slotState.currentTargetLine,
    graded: slotState.graded,
    allFilled: slotState.allFilled,
    selectedTileId: slotState.selectedTileId,
    handleRetry: slotState.handleRetry,
    handleReveal: slotState.handleReveal,
    toggleHint: slotState.toggleHint,
    handleNext,
    handleCheck: slotState.handleCheck,
    setSelectedTileId: slotState.setSelectedTileId,
  });

  return {
    ...layoutState,
    ...slotState,
    reviewRequired,
    reviewComplete,
    handleNext,
  };
}
