import React from "react";
import { ResizableRows } from "../../../ui";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../../types/trivia";
import { MIN_PANEL_HEIGHT_PX, MAX_PANEL_HEIGHT_PX } from "../../../trivia/triviaLayout";
import { CodePuzzle } from "../../../ui";
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

  return (
    <>
      <div
        ref={session.puzzlePanel.ref}
        style={{
          minHeight: "20rem",
          height: "100%",
        }}
      >
        {mode === "choice" ? (
          <ResizableRows
            minRowHeight={MIN_PANEL_HEIGHT_PX}
            maxRowHeight={MAX_PANEL_HEIGHT_PX}
            onHeightsChange={(heights) => session.applyPanelHeights(heights, false)}
            onHeightsCommit={(heights) => session.applyPanelHeights(heights, true)}
            rows={[
              {
                id: "puzzle",
                label: "Puzzle",
                greedy: !session.layout.panelVisibility.tiles,
                visible: session.layout.panelVisibility.puzzle,
                height: session.layout.panelHeights.puzzle,
                content: puzzleColumn,
              },
              {
                id: "tiles",
                label: "Tiles",
                greedy: !session.layout.panelVisibility.puzzle,
                visible: session.layout.panelVisibility.tiles,
                height: session.layout.panelHeights.tiles,
                content: (
                  <TileTray
                    tiles={round.tiles}
                    usedTileIds={session.usedTileIds}
                    selectedTileId={session.selectedTileId}
                    onSelect={session.handleSelectTile}
                    onActivate={session.handleActivateTile}
                    disabled={session.graded}
                  />
                ),
              },
            ]}
          />
        ) : session.layout.panelVisibility.puzzle ? (
          puzzleColumn
        ) : null}
      </div>
    </>
  );
};
