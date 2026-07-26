import React, { useEffect, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { RotateCcw, RefreshCw, ArrowRight, ArrowLeft, Check, ExternalLink } from 'lucide-react';
import { Badge, Button, Kbd } from '../../ui';
import { describeMode, gradeRound } from '../../trivia/triviaEngine';
import type { TriviaGrade, TriviaMeta, TriviaMode, TriviaRound } from '../../types/trivia';
import { CodePuzzle } from './CodePuzzle';
import { TileTray } from './TileTray';

export interface TriviaSessionProps {
  round: TriviaRound;
  algorithmTitle: string;
  mode: TriviaMode;
  /** Current difficulty, for the trailing "Level N · X% covered" line. */
  level: number;
  /** Deck coverage at the configured levels, 0-100, for the same line. */
  coverage: number;
  /** Fires on "Check answers" with the map the engine should grade and record. */
  onSubmit: (answers: Record<number, string>) => void;
  onNext: () => void;
  /** Navigates back to setup. Not a pause — nothing here is suspended. */
  onExitToSetup?: () => void;
  onStudyInWorkspace?: (algorithmId?: string) => void;
  hints?: TriviaMeta['hints'];
  lineExplanations?: TriviaMeta['lineExplanations'];
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
  level,
  coverage,
  onSubmit,
  onNext,
  onExitToSetup,
  onStudyInWorkspace,
  hints,
  lineExplanations,
}: TriviaSessionProps): React.ReactElement {
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [typed, setTyped] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<readonly number[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [grade, setGrade] = useState<TriviaGrade | null>(null);
  const [openHints, setOpenHints] = useState<readonly number[]>([]);

  useEffect(() => {
    setPlacements({});
    setTyped({});
    setRevealed([]);
    setSelectedTileId(null);
    setGrade(null);
    setOpenHints([]);
  }, [round, mode]);

  const graded = grade !== null;

  const filledAnswers: Record<number, string> = {};
  round.blanks.forEach((line) => {
    if (revealed.includes(line)) {
      filledAnswers[line] = truthOf(round, line);
      return;
    }
    if (mode === 'choice') {
      const tileId = placements[line];
      if (tileId !== undefined) filledAnswers[line] = tileTextOf(round, tileId);
      return;
    }
    const text = typed[line];
    if (text !== undefined) filledAnswers[line] = text;
  });

  const submission: Record<number, string> = {};
  round.blanks.forEach((line) => {
    submission[line] = revealed.includes(line) ? '' : (filledAnswers[line] ?? '');
  });

  const allFilled = round.blanks.every((line) => (filledAnswers[line] ?? '').trim().length > 0);
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
    if ((filledAnswers[line] ?? '').length > 0) clearSlot(line);
  };

  const handleSelectTile = (tileId: string): void => {
    if (graded) return;
    setSelectedTileId((current) => (current === tileId ? null : tileId));
  };

  /* A plain click is a commit, not a hold: it fills the lowest-numbered
     still-empty blank immediately, no second click on a slot required.
     Out-of-order placement stays reachable through drag (TileTray's
     onSelect/handleSelectTile still drives the drop's selected-tile
     fallback) — once every blank already has an answer, a click falls back
     to the old select-then-click-a-slot path so a full board isn't a dead
     end for swapping one answer for another. */
  const handleActivateTile = (tileId: string): void => {
    if (graded) return;
    if (!round.tiles.some((tile) => tile.id === tileId)) return;
    const nextEmpty = [...round.blanks]
      .sort((a, b) => a - b)
      .find((line) => !revealed.includes(line) && (filledAnswers[line] ?? '').trim().length === 0);
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
      current.includes(line) ? current.filter((n) => n !== line) : [...current, line]
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
  };

  const handleNext = (): void => {
    onNext();
  };

  /* The line a global Reveal/Hint keypress acts on when nothing is
     focused: the first blank that is neither filled nor revealed yet, or —
     once every blank is filled/revealed — the round's first blank, so the
     shortcut always has a sane, discoverable target (see the Kbd hint
     CodePuzzle renders on this exact row via activeShortcutLine). */
  const firstOpenBlank = round.blanks.find(
    (line) => !revealed.includes(line) && (filledAnswers[line] ?? '').trim().length === 0
  );
  const currentTargetLine: number | null = firstOpenBlank ?? (round.blanks[0] ?? null);

  // Keyboard navigation & shortcuts. No dependency array: these handlers
  // close over round-derived state (submission, allFilled, currentTargetLine,
  // ...) that changes on nearly every keystroke, and re-subscribing after
  // every render is the simplest way to guarantee the listener never fires
  // against stale state.
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent): void => {
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (meta && key === 'r') {
        e.preventDefault();
        handleRetry();
        return;
      }
      if (meta && key === 'e') {
        e.preventDefault();
        if (currentTargetLine !== null) handleReveal(currentTargetLine);
        return;
      }
      /* 'i' is the binding actually advertised to the user (CodePuzzle's Kbd
         badge shows ⌘I): on macOS, Cmd+H is "Hide <App>" in every browser's
         own Application menu, a main-menu key equivalent AppKit resolves
         before the keydown reaches page JS at all, so it can never be
         caught here no matter what we do — 'h' is kept only as a harmless
         fallback for whatever environment doesn't reserve it. */
      if (meta && (key === 'h' || key === 'i')) {
        e.preventDefault();
        if (currentTargetLine !== null) toggleHint(currentTargetLine);
        return;
      }
      if (meta && e.key === 'Enter') {
        e.preventDefault();
        if (graded) {
          handleNext();
        } else if (allFilled) {
          handleCheck();
        }
        return;
      }
      if (e.key === 'Escape' && selectedTileId !== null) {
        setSelectedTileId(null);
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  });

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
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <div
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
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {onStudyInWorkspace ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<ExternalLink aria-hidden="true" />}
                onClick={() => onStudyInWorkspace(round.algorithmId)}
              >
                Study in workspace
              </Button>
            ) : null}
            {onExitToSetup ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<ArrowLeft aria-hidden="true" />}
                onClick={onExitToSetup}
              >
                Exit to setup
              </Button>
            ) : null}
          </div>
        </div>
        {/* Replaces the setup screen's 4-badge row and progress bar with the one
            line worth carrying into drill mode. */}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {`Level ${level} · ${coverage}% covered`}
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
            filled={filledAnswers}
            revealed={revealed}
            grade={grade}
            hasSelection={selectedTileId !== null}
            onSlotActivate={handleSlotActivate}
            onTileDrop={placeTile}
            onTypeAnswer={handleTypeAnswer}
            onReveal={handleReveal}
            onSubmit={handleCheck}
            hints={hints}
            lineExplanations={lineExplanations}
            openHints={openHints}
            onToggleHint={toggleHint}
            activeShortcutLine={currentTargetLine}
          />
        </div>

        {mode === 'choice' && (
          <div style={{ flex: '0 0 18rem', minWidth: '16rem' }}>
            <TileTray
              tiles={round.tiles}
              usedTileIds={usedTileIds}
              selectedTileId={selectedTileId}
              onSelect={handleSelectTile}
              onActivate={handleActivateTile}
              disabled={graded}
            />
          </div>
        )}
      </div>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          borderTop: '1px solid var(--border-default)',
          paddingTop: 'var(--space-3)',
        }}
      >
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {grade === null ? (
            <span>
              {Object.keys(filledAnswers).length} of {round.blanks.length} blanks filled
            </span>
          ) : (
            <span
              role="status"
              aria-live="polite"
              style={{
                color: grade.allCorrect ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                fontWeight: 600,
              }}
            >
              {`${correctCount} of ${round.blanks.length} correct. `}
              {grade.allCorrect ? 'All correct! Great recall.' : 'Review red lines and try next.'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button
            variant="ghost"
            size="md"
            onClick={handleRetry}
            icon={<RefreshCw aria-hidden="true" />}
          >
            Retry <Kbd>⌘R</Kbd>
          </Button>
          {grade === null ? (
            <Button
              variant="primary"
              size="md"
              disabled={!allFilled}
              onClick={handleCheck}
              icon={<Check aria-hidden="true" />}
            >
              Check answers <Kbd>⌘Enter</Kbd>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleNext}
              icon={grade.allCorrect ? <ArrowRight aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
            >
              {grade.allCorrect ? 'Next round' : 'Try again'} <Kbd>⌘Enter</Kbd>
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}
