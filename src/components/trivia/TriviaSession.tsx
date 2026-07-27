import React from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { ResizableLayout, ResizableRows } from "../../ui";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../types/trivia";
import { getAlgorithm } from "../../algorithms/registry";
import { ProblemDescriptionCard } from "../../ui";
import { getAlgorithmPrimaryCategory } from "../../app/categories";

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
        layout={session.layout}
        onTogglePanel={session.handleTogglePanel}
        mode={mode}
      />

      <div style={{ flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <ResizableLayout
          splitPercent={session.layout.problemSplitPercent}
          onSplitChange={session.handleProblemSplitChange}
          onSplitCommit={session.handleProblemSplitCommit}
          showLeft={session.layout.panelVisibility.problem && algorithm !== undefined}
          showRight={
            session.layout.panelVisibility.puzzle ||
            (mode === "choice" && session.layout.panelVisibility.tiles)
          }
          handleLabel="Resize problem description and puzzle columns"
          leftPanel={
            algorithm ? (
              <ResizableRows
                rows={[
                  {
                    id: "problem",
                    label: "Problem description",
                    greedy: true,
                    content: (
                      <ProblemDescriptionCard
                        title={algorithm.title}
                        category={getAlgorithmPrimaryCategory(algorithm)}
                        difficulty={algorithm.difficulty}
                        description={algorithm.description}
                        constraints={algorithm.constraints}
                        examples={algorithm.examples}
                        expanded={session.problemExpanded}
                        onToggleExpanded={session.handleToggleProblemExpanded}
                      />
                    ),
                    height: null,
                  },
                ]}
                onHeightsChange={() => {}}
              />
            ) : null
          }
          rightPanel={
            <TriviaSessionStage
              round={round}
              mode={mode}
              session={session}
              hints={hints}
              lineExplanations={lineExplanations}
            />
          }
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
      />
    </section>
  );
}

TriviaSession.Header = TriviaSessionHeader;
TriviaSession.Footer = TriviaSessionFooter;
TriviaSession.Stage = TriviaSessionStage;
