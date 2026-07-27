import { Card } from "../../ui";
import type { TriviaGrade, TriviaMeta, TriviaMode, TriviaRound } from "../../types/trivia";
import { CodeExplainToggle, LineExplainPopover } from "../primitives/LineExplainPopover";
import { TILE_MIME } from "./codePuzzleTypes";
import { useCodePuzzleDragDrop } from "./hooks/useCodePuzzleDragDrop";
import { useCodePuzzleState } from "./hooks/useCodePuzzleState";
import { CodePuzzleBlankRow } from "./components/CodePuzzleBlankRow";
import { CodePuzzleCodeRow } from "./components/CodePuzzleCodeRow";
import "./CodePuzzle.css";

export { TILE_MIME };

export interface CodePuzzleProps {
  round: TriviaRound;
  mode: TriviaMode;
  filled: Readonly<Record<number, string>>;
  revealed?: readonly number[];
  grade?: TriviaGrade | null;
  hasSelection?: boolean;
  onSlotActivate: (line: number) => void;
  onTileDrop: (line: number, tileId: string) => void;
  onTypeAnswer: (line: number, text: string) => void;
  onReveal: (line: number) => void;
  onSubmit?: () => void;
  hints?: TriviaMeta["hints"];
  lineExplanations?: TriviaMeta["lineExplanations"];
  openHints?: readonly number[];
  onToggleHint?: (line: number) => void;
  activeShortcutLine?: number | null;
}

export function CodePuzzle({
  round,
  mode,
  filled,
  revealed = [],
  grade = null,
  hasSelection = false,
  onSlotActivate,
  onTileDrop,
  onTypeAnswer,
  onReveal,
  onSubmit,
  hints,
  lineExplanations,
  openHints: openHintsProp,
  onToggleHint,
  activeShortcutLine = null,
}: CodePuzzleProps) {
  const graded = grade !== null;

  const {
    explainEnabled,
    setExplainEnabled,
    clickedExplain,
    inputRefs,
    blankRowRefs,
    hovered,
    rowHoverHandlers,
    blanks,
    openHintsSet,
    toggleHint,
    hintFor,
    explanationFor,
    truthFor,
    handleExplainClick,
    hoveredExplanation,
    clickedExplanation,
  } = useCodePuzzleState({
    round,
    mode,
    graded,
    hints,
    lineExplanations,
    openHintsProp,
    onToggleHint,
  });

  const filledCount = round.blanks.filter((line) => (filled[line] ?? "").trim().length > 0).length;

  const { allowRowDrop, handleRowDrop, handleWellDrop } = useCodePuzzleDragDrop({
    graded,
    blankRowRefs,
    onTileDrop,
    onSlotActivate,
  });

  return (
    <Card
      padding="none"
      title={
        <span
          style={{
            fontFamily: "var(--font-code)",
            fontSize: "var(--text-xs)",
            fontWeight: 400,
            color: "var(--text-muted)",
          }}
        >
          solution.py
        </span>
      }
      actions={
        <>
          <CodeExplainToggle
            enabled={explainEnabled}
            onToggle={() => setExplainEnabled((current) => !current)}
          />
          <span
            style={{
              fontFamily: "var(--font-code)",
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
            }}
          >
            {filledCount}/{round.blanks.length} filled
          </span>
        </>
      }
      style={{ borderColor: "var(--border-default)", minWidth: 0 }}
    >
      <div
        data-testid="code-puzzle-well"
        onDragOver={allowRowDrop}
        onDragEnter={allowRowDrop}
        onDrop={handleWellDrop}
        style={{
          minHeight: 0,
          overflow: "auto",
          background: "var(--bg-inset)",
          borderTop: "1px solid var(--border-default)",
          padding: "var(--space-2) 0",
        }}
      >
        {round.lines.map((line) =>
          blanks.has(line.number) ? (
            <CodePuzzleBlankRow
              key={line.number}
              line={line}
              mode={mode}
              filledText={filled[line.number] ?? ""}
              revealed={revealed}
              grade={grade}
              hasSelection={hasSelection}
              hint={hintFor(line.number)}
              explanation={explanationFor(line.number)}
              showHint={openHintsSet.has(line.number)}
              expectedTruth={truthFor(line.number)}
              isShortcutTarget={activeShortcutLine === line.number}
              blankRowRefs={blankRowRefs}
              inputRefs={inputRefs}
              onSlotActivate={onSlotActivate}
              onTileDrop={onTileDrop}
              onTypeAnswer={onTypeAnswer}
              onReveal={onReveal}
              onSubmit={onSubmit}
              onToggleHint={toggleHint}
              onExplainClick={handleExplainClick}
              rowHoverHandlers={rowHoverHandlers}
              allowRowDrop={allowRowDrop}
              handleRowDrop={handleRowDrop}
            />
          ) : (
            <CodePuzzleCodeRow
              key={line.number}
              line={line}
              explanation={explanationFor(line.number)}
              rowHoverHandlers={rowHoverHandlers}
            />
          ),
        )}
      </div>
      {explainEnabled && hovered !== null && hoveredExplanation !== undefined ? (
        <LineExplainPopover
          line={hovered.line}
          explanation={hoveredExplanation}
          anchorRect={hovered.rect}
          side="left"
        />
      ) : null}
      {clickedExplain !== null && clickedExplanation !== undefined ? (
        <LineExplainPopover
          line={clickedExplain.line}
          explanation={clickedExplanation}
          anchorRect={clickedExplain.rect}
          side="right"
        />
      ) : null}
    </Card>
  );
}

CodePuzzle.BlankRow = CodePuzzleBlankRow;
CodePuzzle.CodeRow = CodePuzzleCodeRow;
