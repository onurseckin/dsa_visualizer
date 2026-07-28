import React from "react";
import { ResizableLayout } from "../../../ui";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../../types/trivia";
import { CodePuzzle } from "../../../ui/molecules/CodePuzzle";
import { TileTray } from "../../../ui";
import { useTriviaSessionState } from "../hooks/useTriviaSessionState";

export interface TriviaSessionStageProps {
  round: TriviaRound;
  mode: TriviaMode;
  session: ReturnType<typeof useTriviaSessionState>;
  hints?: TriviaMeta["hints"];
  lineExplanations?: TriviaMeta["lineExplanations"];
}

export const TriviaSessionStage: React.FC<TriviaSessionStageProps> = ({
  round,
  mode,
  session,
  hints,
  lineExplanations,
}) => {
  const puzzleColumn = (
    <CodePuzzle
      round={round}
      mode={mode}
      filled={session.filledAnswers}
      revealed={session.revealed}
      grade={session.grade}
      hasSelection={session.selectedTileId !== null}
      onSlotActivate={session.handleSlotActivate}
      onTileDrop={session.placeTile}
      onTypeAnswer={session.handleTypeAnswer}
      onReveal={session.handleReveal}
      onSubmit={session.handleCheck}
      hints={hints}
      lineExplanations={lineExplanations}
      openHints={session.openHints}
      onToggleHint={session.toggleHint}
      activeShortcutLine={session.currentTargetLine}
      showLineInfo={session.layout.panelVisibility.lineInfo}
    />
  );

  const tilesColumn = (
    <TileTray
      tiles={round.tiles}
      usedTileIds={session.usedTileIds}
      selectedTileId={session.selectedTileId}
      onSelect={session.handleSelectTile}
      onActivate={session.handleActivateTile}
      disabled={session.graded}
    />
  );

  return (
    <div
      ref={session.puzzlePanel.ref}
      style={{
        minHeight: "12rem",
        height: "100%",
        flex: "1 1 0%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <ResizableLayout
        splitPercent={session.layout.puzzleSplitPercent}
        onSplitChange={session.handleSplitChange}
        onSplitCommit={session.handleSplitCommit}
        showLeft={mode === "choice" && session.layout.panelVisibility.tiles}
        showRight={session.layout.panelVisibility.puzzle}
        handleLabel="Resize tiles and puzzle columns"
        leftPanel={tilesColumn}
        rightPanel={puzzleColumn}
      />
    </div>
  );
};
