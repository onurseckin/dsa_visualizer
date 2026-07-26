import React from "react";
import { DragHandle, ResizableLayout } from "../../ResizableLayout";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../../types/trivia";
import {
  MAX_PANEL_HEIGHT_PX,
  MAX_SPLIT_PERCENT,
  MIN_PANEL_HEIGHT_PX,
  MIN_SPLIT_PERCENT,
} from "../../../trivia/triviaLayout";
import { CodePuzzle } from "../CodePuzzle";
import { TileTray } from "../TileTray";
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
    />
  );

  return (
    <>
      <div
        ref={session.puzzlePanel.ref}
        style={{
          minHeight:
            session.layout.panelHeights.puzzle !== null
              ? `${session.layout.panelHeights.puzzle}px`
              : "20rem",
          height:
            session.layout.panelHeights.puzzle !== null
              ? `${session.layout.panelHeights.puzzle}px`
              : undefined,
          overflow: session.layout.panelHeights.puzzle !== null ? "auto" : "visible",
        }}
      >
        {mode === "choice" ? (
          <ResizableLayout
            leftPanel={puzzleColumn}
            rightPanel={
              <TileTray
                tiles={round.tiles}
                usedTileIds={session.usedTileIds}
                selectedTileId={session.selectedTileId}
                onSelect={session.handleSelectTile}
                onActivate={session.handleActivateTile}
                disabled={session.graded}
              />
            }
            splitPercent={session.layout.puzzleSplitPercent}
            minLeftPercent={MIN_SPLIT_PERCENT}
            maxLeftPercent={MAX_SPLIT_PERCENT}
            onSplitChange={session.handleSplitChange}
            onSplitCommit={session.handleSplitCommit}
            handleLabel="Resize puzzle and tiles columns"
          />
        ) : (
          puzzleColumn
        )}
      </div>

      <DragHandle
        orientation="horizontal"
        label="Resize the puzzle row"
        valueNow={session.layout.panelHeights.puzzle ?? MIN_PANEL_HEIGHT_PX}
        valueMin={MIN_PANEL_HEIGHT_PX}
        valueMax={MAX_PANEL_HEIGHT_PX}
        valueText={
          session.layout.panelHeights.puzzle === null ? "Automatic, sized to content" : undefined
        }
        step={16}
        dragging={session.puzzlePanel.dragging}
        onDragStart={() => session.puzzlePanel.setDragging(true)}
        onNudge={session.puzzlePanel.nudge}
        onRestoreDefault={session.puzzlePanel.restoreDefault}
      />
    </>
  );
};
