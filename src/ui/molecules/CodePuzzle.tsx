import { Card } from "..";
import type { TriviaGrade, TriviaMeta, TriviaMode, TriviaRound } from "../../types/trivia";
import { LineExplainPopover } from "../../components/primitives/LineExplainPopover";
import { TILE_MIME } from "../../components/trivia/codePuzzleTypes";
import { useCodePuzzleDragDrop } from "../../components/trivia/hooks/useCodePuzzleDragDrop";
import { useCodePuzzleState } from "../../components/trivia/hooks/useCodePuzzleState";
import { CodePuzzleBlankRow } from "../../components/trivia/components/CodePuzzleBlankRow";
import { CodePuzzleCodeRow } from "../../components/trivia/components/CodePuzzleCodeRow";
import "../styles/CodePuzzle.css";

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
  showLineInfo?: boolean;
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
  showLineInfo = true,
}: CodePuzzleProps) {
  const graded = grade !== null;

  const {
    clickedExplain,
    inputRefs,
    blankRowRefs,
    hovered,
    rowHoverHandlers,
    blanks,
    openHintsSet,
    hintFor,
    explanationFor,
    truthFor,
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
    showLineInfo,
  });

  const { allowRowDrop, handleRowDrop, handleWellDrop } = useCodePuzzleDragDrop({
    graded,
    blankRowRefs,
    onTileDrop,
    onSlotActivate,
  });

  return (
    <Card
      style={{ borderColor: "var(--border-default)", minWidth: 0, height: "100%" }}
      className="border border-[var(--border-default)] rounded-2xl p-0 bg-[var(--bg-inset)] shadow-lg hover:border-[var(--accent)] transition-all font-mono text-sm leading-relaxed overflow-hidden flex flex-col h-full min-h-0"
    >
      <div
        data-testid="code-puzzle-well"
        onDragOver={allowRowDrop}
        onDragEnter={allowRowDrop}
        onDrop={handleWellDrop}
        style={{
          minHeight: 0,
          maxHeight: "100%",
          overflow: "auto",
          background: "var(--bg-inset)",
          borderTop: "2px solid transparent",
          padding: "var(--space-2) 0",
          flex: "1 1 auto",
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
      {hovered !== null && hoveredExplanation !== undefined ? (
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
          side="left"
        />
      ) : null}
    </Card>
  );
}

CodePuzzle.BlankRow = CodePuzzleBlankRow;
CodePuzzle.CodeRow = CodePuzzleCodeRow;
