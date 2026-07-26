import React, { DragEvent, MouseEvent, MutableRefObject, useState } from "react";
import { Eye, Lightbulb } from "lucide-react";
import { IconButton, Kbd } from "../../../ui";
import { PuzzleLine, TriviaGrade, TriviaMode } from "../../../types/trivia";
import { highlightPythonLine } from "../../primitives/CodeBlockViewer";
import { CodePuzzleSlot } from "./CodePuzzleSlot";
import { CODE_GROUP, GUTTER, ICON_GROUP, INDENT } from "../codePuzzleTypes";

interface CodePuzzleBlankRowProps {
  line: PuzzleLine;
  mode: TriviaMode;
  filledText: string;
  revealed: readonly number[];
  grade: TriviaGrade | null;
  hasSelection: boolean;
  hint?: string;
  explanation?: string;
  showHint: boolean;
  expectedTruth: string;
  isShortcutTarget: boolean;
  blankRowRefs: MutableRefObject<Map<number, HTMLDivElement>>;
  inputRefs: MutableRefObject<Map<number, HTMLInputElement>>;
  onSlotActivate: (line: number) => void;
  onTileDrop: (line: number, tileId: string) => void;
  onTypeAnswer: (line: number, text: string) => void;
  onReveal: (line: number) => void;
  onSubmit?: () => void;
  onToggleHint: (line: number) => void;
  onExplainClick: (line: number, event: MouseEvent<HTMLButtonElement>) => void;
  rowHoverHandlers?: (line: number) => {
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
  allowRowDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleRowDrop: (line: number) => (event: DragEvent<HTMLDivElement>) => void;
}

export const CodePuzzleBlankRow: React.FC<CodePuzzleBlankRowProps> = ({
  line,
  mode,
  filledText,
  revealed,
  grade,
  hasSelection,
  hint,
  explanation,
  showHint,
  expectedTruth,
  isShortcutTarget,
  blankRowRefs,
  inputRefs,
  onSlotActivate,
  onTypeAnswer,
  onReveal,
  onSubmit,
  onToggleHint,
  onExplainClick,
  rowHoverHandlers,
  allowRowDrop,
  handleRowDrop,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const number = line.number;
  const graded = grade !== null;
  const wrong = graded && !grade.perBlank[number];
  const hoverHandlers =
    explanation !== undefined && rowHoverHandlers ? rowHoverHandlers(number) : undefined;

  const handleDragOverRow = (e: DragEvent<HTMLDivElement>) => {
    allowRowDrop(e);
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeaveRow = () => {
    setIsDragOver(false);
  };

  const handleDropRow = (e: DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    handleRowDrop(number)(e);
  };

  return (
    <div
      className={`ui-code-line transition-all ${
        isDragOver
          ? "bg-[var(--bg-hover)] rounded-[var(--radius-sm)] outline outline-1 outline-[var(--accent)]"
          : ""
      }`}
      data-testid={`blank-row-${number}`}
      ref={(el) => {
        if (el) blankRowRefs.current.set(number, el);
        else blankRowRefs.current.delete(number);
      }}
      onMouseEnter={hoverHandlers?.onMouseEnter}
      onMouseLeave={hoverHandlers?.onMouseLeave}
      onDragOver={handleDragOverRow}
      onDragEnter={handleDragOverRow}
      onDragLeave={handleDragLeaveRow}
      onDrop={handleDropRow}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}
      >
        <div style={CODE_GROUP}>
          <span style={GUTTER}>{number}</span>
          <span aria-hidden="true" data-testid={`indent-${number}`} style={INDENT}>
            {line.indent}
          </span>
          <CodePuzzleSlot
            line={number}
            mode={mode}
            filledText={filledText}
            revealed={revealed}
            grade={grade}
            hasSelection={hasSelection}
            inputRefs={inputRefs}
            onSlotActivate={onSlotActivate}
            onTypeAnswer={onTypeAnswer}
            onSubmit={onSubmit}
          />
        </div>
        <div style={ICON_GROUP}>
          {hint !== undefined || explanation !== undefined ? (
            <IconButton
              icon={<Lightbulb />}
              variant="secondary"
              size="sm"
              selected={showHint}
              title="Toggle hint / explanation (⌘I)"
              aria-label={`Hint for line ${number}`}
              onClick={(e) => {
                if (hint !== undefined) onToggleHint(number);
                if (explanation !== undefined) onExplainClick(number, e);
              }}
            >
              {isShortcutTarget ? (
                <Kbd
                  aria-hidden="true"
                  data-testid={`shortcut-target-${number}`}
                  title={`Line ${number} is the current target for the ⌘I shortcut`}
                >
                  ⌘I
                </Kbd>
              ) : null}
            </IconButton>
          ) : null}
          <IconButton
            icon={<Eye />}
            variant="secondary"
            size="sm"
            title="Reveal answer (⌘E)"
            aria-label={`Reveal line ${number}`}
            disabled={graded || revealed.includes(number)}
            onClick={() => onReveal(number)}
          >
            {isShortcutTarget ? (
              <Kbd
                aria-hidden="true"
                data-testid={
                  hint === undefined && explanation === undefined
                    ? `shortcut-target-${number}`
                    : undefined
                }
                title={`Line ${number} is the current target for the ⌘E shortcut`}
              >
                ⌘E
              </Kbd>
            ) : null}
          </IconButton>
        </div>
      </div>
      {showHint && hint !== undefined ? (
        <div
          data-testid={`hint-${number}`}
          style={{
            padding: "var(--space-1) 0 0 3.5em",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-xs)",
            whiteSpace: "normal",
            color: "var(--text-muted)",
          }}
        >
          {hint}
        </div>
      ) : null}
      {wrong ? (
        <div
          data-testid={`expected-${number}`}
          style={{
            padding: "var(--space-1) 0 0 3.5em",
            fontFamily: "var(--font-code)",
            fontSize: "var(--text-xs)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <span style={{ color: "var(--success)", fontWeight: 600 }}>Expected:</span>
          {highlightPythonLine(expectedTruth)}
        </div>
      ) : null}
    </div>
  );
};
