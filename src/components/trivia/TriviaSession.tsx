import React from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type {
  TriviaMeta,
  TriviaMode,
  TriviaReviewSubmission,
  TriviaRound,
} from "../../types/trivia";

import { useTriviaSessionState } from "./hooks/useTriviaSessionState";
import { TriviaSessionHeader } from "./components/TriviaSessionHeader";
import { TriviaSessionFooter } from "./components/TriviaSessionFooter";
import { TriviaSessionStage } from "./components/TriviaSessionStage";

export interface TriviaSessionProps {
  round: TriviaRound;
  algorithmTitle: string;
  mode: TriviaMode;
  /** Current difficulty, for the trailing "Level N · X% covered" line. */
  level: number;
  /** Deck coverage at the configured levels, 0-100, for the same line. */
  coverage: number;
  /** Fires on "Check answers" with the map the engine should grade and record. */
  onSubmit: (answers: Record<number, string>) => void;
  onReview?: (submission: TriviaReviewSubmission) => void;
  onNext: () => void;
  onEditSettings?: () => void;
  onBackToHome?: () => void;
  onStudyInWorkspace?: (algorithmId?: string) => void;
  hints?: TriviaMeta["hints"];
  lineExplanations?: TriviaMeta["lineExplanations"];
}

export function TriviaSession({
  round,
  algorithmTitle,
  mode,
  level,
  coverage,
  onSubmit,
  onReview,
  onNext,
  onEditSettings,
  onBackToHome,
  onStudyInWorkspace,
  hints,
  lineExplanations,
}: TriviaSessionProps): React.ReactElement {
  const session = useTriviaSessionState({ round, mode, onSubmit, onReview, onNext });

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape" && session.selectedTileId !== null) session.setSelectedTileId(null);
  };

  const hiddenLabel = `Hiding ${round.level} ${round.level === 1 ? "line" : "lines"}`;

  return (
    <section
      onKeyDown={handleKeyDown}
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", minHeight: 0 }}
    >
      <TriviaSessionHeader
        algorithmTitle={algorithmTitle}
        hiddenLabel={hiddenLabel}
        modeDescription={session.modeDescription}
        level={level}
        coverage={coverage}
        algorithmId={round.algorithmId}
        onStudyInWorkspace={onStudyInWorkspace}
        onEditSettings={onEditSettings}
        onBackToHome={onBackToHome}
        layout={session.layout}
        onTogglePanel={session.handleTogglePanel}
        mode={mode}
      />

      <div style={{ flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <TriviaSessionStage
          round={round}
          mode={mode}
          session={session}
          hints={hints}
          lineExplanations={lineExplanations}
        />
      </div>

      <TriviaSessionFooter
        grade={session.grade}
        totalBlanks={round.blanks.length}
        correctCount={session.correctCount}
        allFilled={session.allFilled}
        onRetry={session.handleRetry}
        onCheck={session.handleCheck}
        onNext={session.handleNext}
        retrievalPrompt={round.retrievalPrompt}
        misconceptionCodes={session.grade?.misconceptionCodes}
        reviewResponse={session.reviewResponse}
        confidence={session.confidence}
        reviewComplete={session.reviewComplete}
        onReviewResponseChange={session.setReviewResponse}
        onConfidenceChange={session.setConfidence}
      />
    </section>
  );
}

TriviaSession.Header = TriviaSessionHeader;
TriviaSession.Footer = TriviaSessionFooter;
TriviaSession.Stage = TriviaSessionStage;
