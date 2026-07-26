import { useEffect, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { RotateCcw, ArrowRight, Check } from 'lucide-react';
import { Badge, Button } from '../../ui';
import { describeMode, gradeRound } from '../../trivia/triviaEngine';
import type { TriviaGrade, TriviaMeta, TriviaMode, TriviaRound } from '../../types/trivia';
import { CodePuzzle } from './CodePuzzle';
import { TileTray } from './TileTray';

export interface TriviaSessionProps {
  round: TriviaRound;
  algorithmTitle: string;
  mode: TriviaMode;
  /** Fires on "Check answers" with the map the engine should grade and record. */
  onSubmit: (answers: Record<number, string>) => void;
  onNext: () => void;
  hints?: TriviaMeta['hints'];
}

const tileTextOf = (round: TriviaRound, tileId: string): string =>
  round.tiles.find((tile) => tile.id === tileId)?.text ?? '';

const truthOf = (round: TriviaRound, line: number): string =>
  round.lines.find((candidate) => candidate.number === line)?.content ?? '';

const omit = (source: Readonly<Record<number, string>>, line: number): Record<number, string> => {
  const next: Record<number, string> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (Number(key) !== line) next[Number(key)] = value;
  });
  return next;
};

export function TriviaSession({
  round,
  algorithmTitle,
  mode,
  onSubmit,
  onNext,
  hints,
}: TriviaSessionProps) {
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<readonly number[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [grade, setGrade] = useState<TriviaGrade | null>(null);

  useEffect(() => {
    setPlacements({});
    setTyped({});
    setRevealed([]);
    setSelectedTileId(null);
    setGrade(null);
  }, [round, mode]);

  const graded = grade !== null;

  const filled: Record<number, string> = {};
  round.blanks.forEach((line) => {
    if (revealed.includes(line)) {
      filled[line] = truthOf(round, line);
      return;
    }
    if (mode === 'choice') {
      const tileId = placements[line];
      if (tileId !== undefined) filled[line] = tileTextOf(round, tileId);
      return;
    }
    const text = typed[line];
    if (text !== undefined) filled[line] = text;
  });

  const submission: Record<number, string> = {};
  round.blanks.forEach((line) => {
    submission[line] = revealed.includes(line) ? '' : (filled[line] ?? '');
  });

  const allFilled = round.blanks.every((line) => (filled[line] ?? '').trim().length > 0);
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
    if (mode === 'choice' && selectedTileId !== null) {
      placeTile(line, selectedTileId);
      return;
    }
    if ((filled[line] ?? '').length > 0) clearSlot(line);
  };

  const handleSelectTile = (tileId: string): void => {
    if (graded) return;
    setSelectedTileId((current) => (current === tileId ? null : tileId));
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
  };

  const handleNext = (): void => {
    onNext();
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleRetry();
        return;
      }
      if (e.key === 'Escape' && selectedTileId !== null) {
        setSelectedTileId(null);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [selectedTileId]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape' && selectedTileId !== null) setSelectedTileId(null);
  };

  const correctCount = round.blanks.filter((line) => grade?.perBlank[line] === true).length;
  const hiddenLabel = `Hiding ${round.level} ${round.level === 1 ? 'line' : 'lines'}`;

  return (
    <section
      onKeyDown={handleKeyDown}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: 0 }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {algorithmTitle}
        </h2>
        <Badge size="md">{hiddenLabel}</Badge>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          {describeMode(mode)}
        </span>
      </header>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
          minHeight: 0,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 24rem', minWidth: 0 }}>
          <CodePuzzle
            round={round}
            mode={mode}
            filled={filled}
            revealed={revealed}
            grade={grade}
            hasSelection={selectedTileId !== null}
            onSlotActivate={handleSlotActivate}
            onTileDrop={placeTile}
            onTypeAnswer={handleTypeAnswer}
            onReveal={handleReveal}
            onSubmit={handleCheck}
            onRetry={handleRetry}
            hints={hints}
          />
        </div>
        {mode === 'choice' ? (
          <div style={{ flex: '0 1 18rem', minWidth: 0 }}>
            <TileTray
              tiles={round.tiles}
              usedTileIds={usedTileIds}
              selectedTileId={selectedTileId}
              onSelect={handleSelectTile}
              disabled={graded}
            />
          </div>
        ) : null}
      </div>

      {/* Button Flow: Check answers -> Next round & Retry */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant={graded ? 'secondary' : 'primary'}
          size="md"
          icon={<Check aria-hidden="true" />}
          disabled={graded || !allFilled}
          onClick={handleCheck}
        >
          Check answers
        </Button>
        <Button
          variant={graded ? 'primary' : 'secondary'}
          size="md"
          icon={<ArrowRight aria-hidden="true" />}
          disabled={!graded}
          onClick={handleNext}
        >
          Next round
        </Button>
        {graded && (
          <Button
            variant="secondary"
            size="md"
            icon={<RotateCcw aria-hidden="true" />}
            onClick={handleRetry}
          >
            Retry
          </Button>
        )}
        <span role="status" style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
          {grade !== null ? (
            <Badge variant={grade.allCorrect ? 'success' : 'danger'} size="md">
              {correctCount} of {round.blanks.length} correct
            </Badge>
          ) : null}
          {graded && revealed.length > 0 ? (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              revealed lines never count
            </span>
          ) : null}
        </span>
      </div>
    </section>
  );
}
