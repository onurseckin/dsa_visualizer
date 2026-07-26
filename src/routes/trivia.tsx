import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Brain, ListChecks, Play, RotateCcw, Trophy } from 'lucide-react';
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaProgress,
  TriviaRound,
} from '../types/trivia';
import {
  coverageRatio,
  gradeRound,
  parsePuzzleLines,
  pickRound,
  recordRound,
} from '../trivia/triviaEngine';
import {
  clearTrivia,
  readTriviaConfig,
  readTriviaProgress,
  writeTriviaConfig,
  writeTriviaProgress,
} from '../trivia/triviaStorage';
import { getAlgorithm } from '../algorithms/registry';
import { Badge, Button, Card, ConfirmDialog } from '../ui';
import { TriviaDeckBuilder } from '../components/trivia/TriviaDeckBuilder';
import { TriviaSettings } from '../components/trivia/TriviaSettings';
import { TriviaSession } from '../components/trivia/TriviaSession';

/* The trivia page (DESIGN.md R8.4).

   This route is the only stateful piece of the feature: the engine is pure and
   the three panels below are presentational, so deck, settings, progress and the
   current round all live here and nowhere else. Every state change that the user
   would expect to survive a reload is written through triviaStorage immediately —
   there is no save button, and a drill abandoned mid-deck has to come back where
   it was left. */

export const Route = createFileRoute('/trivia')({
  component: TriviaPage,
});

/* ui.css defaults card edges to --border-subtle, which barely reads against the
   near-black surface; every panel here promotes it to --border-default (R6.2). */
const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const pageStyle: React.CSSProperties = {
  padding: 'var(--space-6)',
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-4)',
};

/* Builder and settings share a row when there is room and stack when there is
   not, so the deck list never gets squeezed into a one-word column. */
const setupGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 'var(--space-4)',
  alignItems: 'start',
};

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

const barTrackStyle: React.CSSProperties = {
  height: 'var(--space-2)',
  borderRadius: 'var(--radius-full)',
  background: 'var(--bg-inset)',
  border: '1px solid var(--border-default)',
  overflow: 'hidden',
};

interface DeckSources {
  sources: Map<string, PuzzleLine[]>;
  meta: Map<string, TriviaMeta | undefined>;
}

function TriviaPage() {
  /* Read during the first render rather than in an effect: an effect would paint
     an empty deck and default settings first, which reads as "my progress is
     gone" for the one second before it is replaced. */
  const [config, setConfig] = useState<TriviaConfig>(readTriviaConfig);
  const [progress, setProgress] = useState<TriviaProgress>(readTriviaProgress);
  const [round, setRound] = useState<TriviaRound | null>(null);
  /* Latched, not derived: with a fresh deck the setup has to stay put while the
     user adds algorithms, and deriving "setup is open" from an empty deck would
     throw them into a session the instant they picked the first one. */
  const [isSetupOpen, setIsSetupOpen] = useState(() => config.deck.length === 0);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const { sources, meta } = useMemo<DeckSources>(() => {
    const nextSources = new Map<string, PuzzleLine[]>();
    const nextMeta = new Map<string, TriviaMeta | undefined>();
    config.deck.forEach((id) => {
      const algorithm = getAlgorithm(id);
      /* A stored id that is not in the registry is skipped instead of being
         pruned from the deck: storage is shared with older/newer builds, and
         silently rewriting the user's deck would lose the entry for good. */
      if (algorithm === undefined) return;
      nextSources.set(id, parsePuzzleLines(algorithm.code, algorithm.trivia));
      nextMeta.set(id, algorithm.trivia);
    });
    return { sources: nextSources, meta: nextMeta };
  }, [config.deck]);

  const isDeckEmpty = sources.size === 0;
  const showSetup = isSetupOpen || isDeckEmpty;

  /* What the next round will actually hide: the engine clamps a stored level into
     the configured window, so the indicator has to clamp the same way or it will
     advertise a difficulty the drill is not running at. */
  const level =
    round?.level ?? Math.min(Math.max(progress.level, config.minBlanks), config.maxBlanks);
  const coverage = Math.round(coverageRatio(progress, sources, config) * 100);

  // Dropping an algorithm from the deck must also retire the round it was serving.
  useEffect(() => {
    if (round !== null && !sources.has(round.algorithmId)) setRound(null);
  }, [round, sources]);

  useEffect(() => {
    if (showSetup || round !== null || progress.completed || isDeckEmpty) return;
    setRound(pickRound({ config, progress, sources, meta }));
  }, [showSetup, round, progress, config, sources, meta, isDeckEmpty]);

  /* The stored value is authoritative, not the patch: writeTriviaConfig
     normalises min/max, so state has to take back what was actually written. */
  const applyConfig = (patch: Partial<TriviaConfig>) => {
    setConfig(writeTriviaConfig({ ...config, ...patch }));
  };

  const handleSubmit = (answers: Record<number, string>) => {
    if (round === null) return;
    const grade = gradeRound(round, answers);
    setProgress(writeTriviaProgress(recordRound(progress, round, grade, config, sources)));
  };

  const handleNext = () => {
    setRound(pickRound({ config, progress, sources, meta }));
  };

  const handleConfirmReset = () => {
    clearTrivia();
    // Re-read rather than assume the defaults, so memory matches storage exactly.
    setConfig(readTriviaConfig());
    setProgress(readTriviaProgress());
    setRound(null);
    setIsSetupOpen(true);
    setIsResetOpen(false);
  };

  const activeTitle =
    round === null ? '' : getAlgorithm(round.algorithmId)?.title ?? round.algorithmId;

  return (
    <div style={pageStyle}>
      <Card
        style={PANEL_BORDER}
        icon={<Brain aria-hidden="true" />}
        title={
          <span
            style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}
          >
            Trivia
          </span>
        }
        actions={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
            }}
          >
            <Badge variant="neutral" style={PANEL_BORDER}>
              {`Level ${level} of ${config.maxBlanks}`}
            </Badge>
            <Badge variant="neutral" style={PANEL_BORDER}>
              {`${progress.roundsPlayed} round${progress.roundsPlayed === 1 ? '' : 's'}`}
            </Badge>
            {/* One "Start drilling" button, in the setup footer — repeating it up
                here would give two controls the same accessible name. */}
            {showSetup ? null : (
              <Button
                size="sm"
                icon={<ListChecks aria-hidden="true" />}
                onClick={() => setIsSetupOpen(true)}
              >
                Edit deck
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              icon={<RotateCcw aria-hidden="true" />}
              onClick={() => setIsResetOpen(true)}
            >
              Reset progress
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div
            role="progressbar"
            aria-label="Deck coverage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={coverage}
            aria-valuetext={`${coverage}% of the deck drilled`}
            style={barTrackStyle}
          >
            <div
              style={{
                width: `${coverage}%`,
                height: '100%',
                background: 'var(--accent)',
                transition: 'width var(--transition-normal)',
              }}
            />
          </div>
          <span style={hintStyle}>
            {`${coverage}% of the deck drilled at levels ${config.minBlanks}–${config.maxBlanks} · `}
            {isDeckEmpty
              ? 'the deck is empty'
              : `${sources.size} algorithm${sources.size === 1 ? '' : 's'} in the deck`}
            {`. Level ${level} hides ${level} line${level === 1 ? '' : 's'} at a time and only advances once every line has been met at it.`}
          </span>
        </div>
      </Card>

      {showSetup ? (
        <>
          <div style={setupGridStyle}>
            <TriviaDeckBuilder deck={config.deck} onChange={(deck) => applyConfig({ deck })} />
            <TriviaSettings config={config} onChange={applyConfig} />
          </div>
          <Card style={PANEL_BORDER} padding="sm">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
              }}
            >
              <span style={hintStyle}>
                {isDeckEmpty
                  ? 'Add at least one algorithm to the deck to start drilling.'
                  : 'Settings and deck are saved as you change them — start whenever you are ready.'}
              </span>
              <Button
                variant="primary"
                icon={<Play aria-hidden="true" />}
                disabled={isDeckEmpty}
                onClick={() => setIsSetupOpen(false)}
              >
                Start drilling
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          {progress.completed ? (
            <Card
              style={PANEL_BORDER}
              icon={<Trophy aria-hidden="true" />}
              title="Deck complete"
              actions={<Badge variant="success">Curriculum covered</Badge>}
            >
              <span style={hintStyle}>
                {`Every line of all ${sources.size} algorithm${sources.size === 1 ? '' : 's'} has been drilled at up to ${config.maxBlanks} blank${config.maxBlanks === 1 ? '' : 's'}. Raise the hardest level to keep going, add more algorithms, or reset progress to start the deck over.`}
              </span>
            </Card>
          ) : null}

          {round !== null ? (
            <TriviaSession
              round={round}
              algorithmTitle={activeTitle}
              mode={config.mode}
              onSubmit={handleSubmit}
              onNext={handleNext}
              hints={meta.get(round.algorithmId)?.hints}
            />
          ) : progress.completed ? null : (
            <Card style={PANEL_BORDER} title="Nothing to drill at this level">
              <span style={hintStyle}>
                {`No algorithm in the deck has ${level} lines to hide at once. Add a longer solution or lower the hardest level in the deck setup.`}
              </span>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={isResetOpen}
        title="Reset trivia progress?"
        message="Your deck, drill settings, level and every line you have drilled will be deleted. The drill starts over from an empty deck and default settings. This cannot be undone."
        confirmLabel="Delete my progress"
        cancelLabel="Keep drilling"
        destructive
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetOpen(false)}
      />
    </div>
  );
}
