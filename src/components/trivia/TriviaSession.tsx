import React from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { DragHandle } from "../../ui";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../types/trivia";
import { getAlgorithm } from "../../algorithms/registry";
import { ProblemDescriptionCard } from "../../ui";
import { MAX_PANEL_HEIGHT_PX, MIN_PANEL_HEIGHT_PX } from "../../trivia/triviaLayout";
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
  onNext,
  onEditSettings,
  onBackToHome,
  onStudyInWorkspace,
  hints,
  lineExplanations,
}: TriviaSessionProps): React.ReactElement {
  const session = useTriviaSessionState({ round, mode, onSubmit, onNext });

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape" && session.selectedTileId !== null) session.setSelectedTileId(null);
  };

  const hiddenLabel = `Hiding ${round.level} ${round.level === 1 ? "line" : "lines"}`;
  const algorithm = getAlgorithm(round.algorithmId);

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
      />

      {algorithm && (
        <div
          ref={session.problemPanel.ref}
          style={{
            flexShrink: 0,
            height:
              session.layout.panelHeights.problem !== null
                ? `${session.layout.panelHeights.problem}px`
                : undefined,
            overflow: session.layout.panelHeights.problem !== null ? "auto" : "visible",
          }}
        >
          <ProblemDescriptionCard
            title={algorithm.title}
            category={algorithm.category}
            difficulty={algorithm.difficulty}
            description={algorithm.description}
            constraints={algorithm.constraints}
            examples={algorithm.examples}
            expanded={session.problemExpanded}
            onToggleExpanded={session.handleToggleProblemExpanded}
          />
        </div>
      )}

      <DragHandle
        orientation="horizontal"
        label="Resize problem description and puzzle rows"
        valueNow={session.layout.panelHeights.problem ?? MIN_PANEL_HEIGHT_PX}
        valueMin={MIN_PANEL_HEIGHT_PX}
        valueMax={MAX_PANEL_HEIGHT_PX}
        valueText={
          session.layout.panelHeights.problem === null ? "Automatic, sized to content" : undefined
        }
        step={16}
        dragging={session.problemPanel.dragging}
        onDragStart={() => session.problemPanel.setDragging(true)}
        onNudge={session.problemPanel.nudge}
        onRestoreDefault={session.problemPanel.restoreDefault}
      />

      <TriviaSessionStage
        round={round}
        mode={mode}
        session={session}
        hints={hints}
        lineExplanations={lineExplanations}
      />

      <TriviaSessionFooter
        grade={session.grade}
        filledCount={Object.keys(session.filledAnswers).length}
        totalBlanks={round.blanks.length}
        correctCount={session.correctCount}
        allFilled={session.allFilled}
        onRetry={session.handleRetry}
        onCheck={session.handleCheck}
        onNext={session.handleNext}
      />
    </section>
  );
}

TriviaSession.Header = TriviaSessionHeader;
TriviaSession.Footer = TriviaSessionFooter;
TriviaSession.Stage = TriviaSessionStage;
