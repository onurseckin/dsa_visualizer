import React, { useEffect, useMemo, useRef, useState } from "react";
import type { TriviaMeta, TriviaMode, TriviaRound } from "../../../types/trivia";
import { useHoveredCodeLine } from "../../primitives/LineExplainPopover";
import type { HoveredLine } from "../../primitives/LineExplainPopover";

export interface UseCodePuzzleStateOptions {
  round: TriviaRound;
  mode: TriviaMode;
  graded: boolean;
  hints?: TriviaMeta["hints"];
  lineExplanations?: TriviaMeta["lineExplanations"];
  openHintsProp?: readonly number[];
  onToggleHint?: (line: number) => void;
  showLineInfo?: boolean;
}

export function useCodePuzzleState({
  round,
  mode,
  graded,
  hints,
  lineExplanations,
  openHintsProp,
  onToggleHint,
  showLineInfo = true,
}: UseCodePuzzleStateOptions) {
  const [internalOpenHints, setInternalOpenHints] = useState<readonly number[]>([]);
  const openHints = openHintsProp ?? internalOpenHints;
  const [clickedExplain, setClickedExplain] = useState<HoveredLine | null>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const blankRowRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const { hovered, rowHoverHandlers } = useHoveredCodeLine();
  const blanks = useMemo(() => new Set(round.blanks), [round.blanks]);
  const openHintsSet = useMemo(() => new Set(openHints), [openHints]);
  const hintMap = useMemo(() => new Map(hints?.map((entry) => [entry.line, entry.hint])), [hints]);
  const truthMap = useMemo(
    () => new Map(round.lines.map((c) => [c.number, c.content])),
    [round.lines],
  );

  useEffect(() => {
    if (mode !== "type" || graded || round.blanks.length === 0) return;
    const firstLine = round.blanks[0];
    const timer = setTimeout(() => {
      inputRefs.current.get(firstLine)?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [round, mode, graded]);

  const toggleHint = (line: number): void => {
    if (onToggleHint) {
      onToggleHint(line);
      return;
    }
    setInternalOpenHints((current) =>
      current.includes(line) ? current.filter((n) => n !== line) : [...current, line],
    );
  };

  const hintFor = (line: number): string | undefined => hintMap.get(line);
  const explanationFor = (line: number): string | undefined => lineExplanations?.[line];
  const truthFor = (line: number): string => truthMap.get(line) ?? "";

  const handleExplainClick = (line: number, event: React.MouseEvent<HTMLButtonElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    setClickedExplain((current) =>
      current !== null && current.line === line ? null : { line, rect },
    );
  };

  const hoveredExplanation =
    showLineInfo && hovered !== null ? explanationFor(hovered.line) : undefined;
  const clickedExplanation =
    showLineInfo && clickedExplain !== null ? explanationFor(clickedExplain.line) : undefined;

  return {
    clickedExplain,
    inputRefs,
    blankRowRefs,
    hovered,
    rowHoverHandlers,
    blanks,
    openHintsSet,
    graded,
    toggleHint,
    hintFor,
    explanationFor,
    truthFor,
    handleExplainClick,
    hoveredExplanation,
    clickedExplanation,
  };
}
