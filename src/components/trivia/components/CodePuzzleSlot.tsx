import React, { KeyboardEvent, MutableRefObject } from "react";
import { Check, X } from "lucide-react";
import { Button, Input } from "../../../ui";
import { TriviaGrade, TriviaMode } from "../../../types/trivia";
import { highlightPythonLine } from "../../primitives/CodeBlockViewer";
import { MONO_INPUT, SLOT_SKIN, SlotState } from "../codePuzzleTypes";

interface CodePuzzleSlotProps {
  line: number;
  mode: TriviaMode;
  filledText: string;
  revealed: readonly number[];
  grade: TriviaGrade | null;
  hasSelection: boolean;
  inputRefs: MutableRefObject<Map<number, HTMLInputElement>>;
  onSlotActivate: (line: number) => void;
  onTypeAnswer: (line: number, text: string) => void;
  onSubmit?: () => void;
}

export const CodePuzzleSlot: React.FC<CodePuzzleSlotProps> = ({
  line,
  mode,
  filledText,
  revealed,
  grade,
  hasSelection,
  inputRefs,
  onSlotActivate,
  onTypeAnswer,
  onSubmit,
}) => {
  const graded = grade !== null;

  const slotState = (): SlotState => {
    if (grade !== null) return grade.perBlank[line] ? "correct" : "incorrect";
    return filledText.length > 0 ? "filled" : "empty";
  };

  const slotLabel = (): string => {
    const content = filledText.length > 0 ? `"${filledText}"` : "empty";
    const isRevealed = revealed.includes(line);
    const state = slotState();
    if (state === "correct") return `Line ${line} ${content} — correct`;
    if (state === "incorrect") {
      return `Line ${line} ${content} — ${isRevealed ? "revealed, not credited" : "incorrect"}`;
    }
    if (isRevealed) return `Line ${line} ${content} — revealed, not credited`;
    if (state === "filled")
      return `Line ${line} ${content} — filled, activate to take the line back`;
    return mode === "choice"
      ? `Line ${line} empty — activate to drop a line here`
      : `Line ${line} empty — type the line`;
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const ordered = [...inputRefs.current.keys()].sort((a, b) => a - b);
      if (ordered.length === 0) return;
      const currentIndex = ordered.indexOf(line);
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + direction + ordered.length) % ordered.length;
      inputRefs.current.get(ordered[nextIndex])?.focus();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit?.();
      return;
    }
  };

  const state = slotState();
  const isRevealed = revealed.includes(line);
  const typing = mode === "type" && !graded && !isRevealed;

  if (typing) {
    return (
      <Input
        size="sm"
        className="code-slot-input font-mono"
        ref={(el) => {
          if (el) inputRefs.current.set(line, el);
          else inputRefs.current.delete(line);
        }}
        aria-label={`Line ${line} — type the missing line`}
        placeholder="type the line"
        value={filledText}
        onChange={(event) => onTypeAnswer(line, event.target.value)}
        onKeyDown={handleInputKeyDown}
        style={{
          ...MONO_INPUT,
          flex: "1 1 0%",
          minWidth: 0,
          padding: "var(--space-1.5) var(--space-3)",
        }}
      />
    );
  }

  const skin = SLOT_SKIN[state];
  const edge = state === "empty" && hasSelection ? "var(--border-accent)" : skin.border;

  return (
    <Button
      size="sm"
      className="code-slot-btn transition-all"
      data-state={state}
      aria-label={slotLabel()}
      aria-pressed={filledText.length > 0}
      disabled={graded}
      onClick={() => onSlotActivate(line)}
      style={{
        flex: "1 1 0%",
        minWidth: 0,
        justifyContent: "flex-start",
        padding: "var(--space-1.5) var(--space-3)",
        fontFamily: "var(--font-code)",
        fontSize: "var(--text-sm)",
        fontWeight: 400,
        borderStyle: skin.borderStyle,
        borderColor: edge,
        background: skin.background,
        color: skin.color,
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "pre",
        }}
      >
        {filledText.length > 0 ? (
          highlightPythonLine(filledText)
        ) : (
          <span style={{ color: skin.color }}>
            {mode === "choice" ? "drop a line here" : "type the line"}
          </span>
        )}
      </span>
      {state === "correct" || state === "incorrect" ? (
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            marginLeft: "auto",
            color: state === "correct" ? "var(--success)" : "var(--danger)",
          }}
        >
          {state === "correct" ? <Check size={14} /> : <X size={14} />}
        </span>
      ) : null}
    </Button>
  );
};
