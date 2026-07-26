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

export const Route = createFileRoute('/trivia')({
  component: TriviaPage,
});

const PANEL_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const pageStyle: React.CSSProperties = {
  padding: 'var(--space-5) var(--space-6)',
  maxWidth: '1440px',
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-5)',
};

const setupGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 'var(--space-5)',
  alignItems: 'start',
};

const hintStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  lineHeight: 1.5,
};

const barTrackStyle: React.CSSProperties = {
  height: 'var(--space-2-5)',
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
  const [config, setConfig] = useState<TriviaConfig>(readTriviaConfig);
  const [progress, setProgress] = useState<TriviaProgress>(readTriviaProgress);
  const [round, setRound] = useState<TriviaRound | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(() => config.deck.length === 0);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const { sources, meta } = useMemo<DeckSources>(() => {
    const nextSources = new Map<string, PuzzleLine[]>();
    const nextMeta = new Map<string, TriviaMeta | undefined>();
    config.deck.forEach((id) => {
      const algorithm = getAlgorithm(id);
      if (algorithm === undefined) return;
      nextSources.set(id, parsePuzzleLines(algorithm.code, algorithm.trivia));
      nextMeta.set(id, algorithm.trivia);
    });
    return { sources: nextSources, meta: nextMeta };
  }, [config.deck]);

  const isDeckEmpty = sources.size === 0;
  const showSetup = isSetupOpen || isDeckEmpty;

  const level =
    round?.level ?? Math.min(Math.max(progress.level, config.minBlanks), config.maxBlanks);
  const coverage = Math.round(coverageRatio(progress, sources, config) * 100);

  useEffect(() => {
    if (round !== null && !sources.has(round.algorithmId)) setRound(null);
  }, [round, sources]);

  useEffect(() => {
    if (showSetup || round !== null || progress.completed || isDeckEmpty) return;
    setRound(pickRound({ config, progress, sources, meta }));
  }, [showSetup, round, progress, config, sources, meta, isDeckEmpty]);

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
      {/* Top Header Card & Master Controls */}
      <Card
        style={PANEL_BORDER}
        icon={<Brain aria-hidden="true" style={{ width: 22, height: 22, color: 'var(--accent)' }} />}
        title={
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Trivia
          </span>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant="info" size="md" style={PANEL_BORDER}>
              Level {level} of {config.maxBlanks}
            </Badge>
            <Badge variant="neutral" size="md" style={PANEL_BORDER}>
              {progress.roundsPlayed} {progress.roundsPlayed === 1 ? 'round' : 'rounds'}
            </Badge>
            <Badge variant="accent" size="md" style={PANEL_BORDER}>
              {sources.size} {sources.size === 1 ? 'algorithm' : 'algorithms'}
            </Badge>
            <Badge variant={coverage >= 100 ? 'success' : 'neutral'} size="md" style={PANEL_BORDER}>
              {coverage}% covered
            </Badge>

            {showSetup ? null : (
              <Button
                size="md"
                variant="secondary"
                icon={<ListChecks aria-hidden="true" />}
                onClick={() => setIsSetupOpen(true)}
              >
                Edit deck
              </Button>
            )}
            <Button
              size="md"
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
                  : 'Settings and deck are saved automatically — start whenever you are ready.'}
              </span>
              <Button
                variant="primary"
                size="md"
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
              actions={<Badge variant="success" size="md">Curriculum covered</Badge>}
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
