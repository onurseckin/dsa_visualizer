import { useEffect, useMemo, useState } from "react";
import { describeMode, gradeRound } from "../../../../trivia/triviaEngine";
import type {
  TriviaConfidence,
  TriviaGrade,
  TriviaMode,
  TriviaRound,
} from "../../../../types/trivia";
import { omit, tileTextOf, truthOf } from "./sessionUtils";

interface UseSessionSlotStateProps {
  round: TriviaRound;
  mode: TriviaMode;
  onSubmit: (answers: Record<number, string>) => void;
}

export function useSessionSlotState({ round, mode, onSubmit }: UseSessionSlotStateProps) {
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<readonly number[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [grade, setGrade] = useState<TriviaGrade | null>(null);
  const [openHints, setOpenHints] = useState<readonly number[]>([]);
  const [reviewResponse, setReviewResponse] = useState("");
  const [confidence, setConfidence] = useState<TriviaConfidence | null>(null);

  useEffect(() => {
    setPlacements({});
    setTyped({});
    setRevealed([]);
    setSelectedTileId(null);
    setGrade(null);
    setOpenHints([]);
    setReviewResponse("");
    setConfidence(null);
  }, [round, mode]);

  const graded = grade !== null;

  const revealedSet = useMemo(() => new Set(revealed), [revealed]);
  const tileTextMap = useMemo(
    () => new Map(round.tiles.map((tile) => [tile.id, tile.text])),
    [round.tiles],
  );
  const lineTruthMap = useMemo(
    () => new Map(round.lines.map((c) => [c.number, c.content])),
    [round.lines],
  );

  const filledAnswers: Record<number, string> = {};
  round.blanks.forEach((line) => {
    if (revealedSet.has(line)) {
      filledAnswers[line] = lineTruthMap.get(line) ?? truthOf(round, line);
      return;
    }
    if (mode === "choice") {
      const tileId = placements[line];
      if (tileId !== undefined)
        filledAnswers[line] = tileTextMap.get(tileId) ?? tileTextOf(round, tileId);
      return;
    }
    const text = typed[line];
    if (text !== undefined) filledAnswers[line] = text;
  });

  const submission: Record<number, string> = {};
  round.blanks.forEach((line) => {
    submission[line] = revealedSet.has(line) ? "" : (filledAnswers[line] ?? "");
  });

  const allFilled = round.blanks.every((line) => (filledAnswers[line] ?? "").trim().length > 0);
  const usedTileIds = Object.values(placements);

  const placeTile = (line: number, tileId: string): void => {
    if (graded) return;
    if (!round.tiles.some((tile) => tile.id === tileId)) return;
    setPlacements((current) => {
      const next: Record<number, string> = {};
      Object.entries(current).forEach(([key, id]) => {
        if (id !== tileId && Number(key) !== line) next[Number(key)] = id;
      });
      next[line] = tileId;
      return next;
    });
    setRevealed((current) => current.filter((n) => n !== line));
    setSelectedTileId(null);
  };

  const clearSlot = (line: number): void => {
    setPlacements((current) => omit(current, line));
    setTyped((current) => omit(current, line));
    setRevealed((current) => current.filter((n) => n !== line));
  };

  const handleSlotActivate = (line: number): void => {
    if (graded) return;
    if (mode === "choice" && selectedTileId !== null) {
      placeTile(line, selectedTileId);
      return;
    }
    if ((filledAnswers[line] ?? "").length > 0) clearSlot(line);
  };

  const handleSelectTile = (tileId: string): void => {
    if (graded) return;
    setSelectedTileId((current) => (current === tileId ? null : tileId));
  };

  const handleActivateTile = (tileId: string): void => {
    if (graded) return;
    if (!round.tiles.some((tile) => tile.id === tileId)) return;
    const nextEmpty = [...round.blanks]
      .sort((a, b) => a - b)
      .find((line) => !revealedSet.has(line) && (filledAnswers[line] ?? "").trim().length === 0);
    if (nextEmpty === undefined) {
      setSelectedTileId((current) => (current === tileId ? null : tileId));
      return;
    }
    placeTile(nextEmpty, tileId);
  };

  const handleTypeAnswer = (line: number, text: string): void => {
    if (graded) return;
    setTyped((current) => ({ ...current, [line]: text }));
  };

  const handleReveal = (line: number): void => {
    if (graded) return;
    setPlacements((current) => omit(current, line));
    setTyped((current) => omit(current, line));
    setRevealed((current) => (current.includes(line) ? current : [...current, line]));
    setSelectedTileId(null);
  };

  const toggleHint = (line: number): void => {
    setOpenHints((current) =>
      current.includes(line) ? current.filter((n) => n !== line) : [...current, line],
    );
  };

  const handleCheck = (): void => {
    if (graded || !allFilled) return;
    setGrade(gradeRound(round, submission));
    setSelectedTileId(null);
    onSubmit(submission);
  };

  const handleRetry = (): void => {
    setPlacements({});
    setTyped({});
    setRevealed([]);
    setSelectedTileId(null);
    setGrade(null);
    setReviewResponse("");
    setConfidence(null);
  };

  const firstOpenBlank = round.blanks.find(
    (line) => !revealedSet.has(line) && (filledAnswers[line] ?? "").trim().length === 0,
  );
  const currentTargetLine: number | null = firstOpenBlank ?? round.blanks[0] ?? null;
  const correctCount = round.blanks.filter((line) => grade?.perBlank[line] === true).length;
  const modeDescription = describeMode(mode);

  return {
    filledAnswers,
    revealed,
    selectedTileId,
    grade,
    openHints,
    graded,
    allFilled,
    usedTileIds,
    correctCount,
    currentTargetLine,
    modeDescription,
    reviewResponse,
    confidence,
    handleSlotActivate,
    placeTile,
    handleSelectTile,
    handleActivateTile,
    handleTypeAnswer,
    handleReveal,
    toggleHint,
    handleCheck,
    handleRetry,
    setReviewResponse,
    setConfidence,
    setSelectedTileId,
  };
}
