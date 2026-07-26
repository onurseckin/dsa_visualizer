import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaProgress,
  TriviaRound,
  TriviaSessionRecord,
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
import {
  createSession,
  deleteSession,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from '../trivia/triviaSessions';
import { getAlgorithm } from '../algorithms/registry';
import { Card, ConfirmDialog } from '../ui';
import { TriviaHeaderCard } from '../components/trivia/TriviaHeaderCard';
import { TriviaSessionsManager } from '../components/trivia/TriviaSessionsManager';
import { TriviaCompletionCard } from '../components/trivia/TriviaCompletionCard';
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

interface DeckSources {
  sources: Map<string, PuzzleLine[]>;
  meta: Map<string, TriviaMeta | undefined>;
}

function TriviaPage() {
  const [sessions, setSessions] = useState<TriviaSessionRecord[]>(readTriviaSessions);
  const [activeId, setActiveId] = useState<string | null>(readActiveSessionId);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId]
  );

  const [config, setConfig] = useState<TriviaConfig>(() =>
    activeSession ? activeSession.config : readTriviaConfig()
  );
  const [progress, setProgress] = useState<TriviaProgress>(() =>
    activeSession ? activeSession.progress : readTriviaProgress()
  );
  const [round, setRound] = useState<TriviaRound | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(() => config.deck.length === 0);
  const [isResetOpen, setIsResetOpen] = useState(false);

  useEffect(() => {
    if (activeSession) {
      setConfig(activeSession.config);
      setProgress(activeSession.progress);
    }
  }, [activeSession]);

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
    const updated = writeTriviaConfig({ ...config, ...patch });
    setConfig(updated);
    if (activeId) {
      updateSession(activeId, { config: updated });
      setSessions(readTriviaSessions());
    }
  };

  const handleSubmit = (answers: Record<number, string>) => {
    if (round === null) return;
    const grade = gradeRound(round, answers);
    const updatedProgress = writeTriviaProgress(
      recordRound(progress, round, grade, config, sources)
    );
    setProgress(updatedProgress);
    if (activeId) {
      updateSession(activeId, { progress: updatedProgress });
      setSessions(readTriviaSessions());
    }
  };

  const handleNext = () => {
    setRound(pickRound({ config, progress, sources, meta }));
  };

  const handlePause = () => {
    if (activeId) {
      updateSession(activeId, { status: 'paused' });
      setSessions(readTriviaSessions());
    }
    setIsSetupOpen(true);
    setRound(null);
  };

  const handleConfirmReset = () => {
    clearTrivia();
    const freshConfig = readTriviaConfig();
    const freshProgress = readTriviaProgress();
    setConfig(freshConfig);
    setProgress(freshProgress);
    setRound(null);
    setIsSetupOpen(true);
    setIsResetOpen(false);

    if (activeId) {
      updateSession(activeId, { config: freshConfig, progress: freshProgress, status: 'active' });
      setSessions(readTriviaSessions());
    }
  };

  const handleCreateNewSession = () => {
    const newS = createSession(undefined, config, progress);
    setSessions(readTriviaSessions());
    setActiveId(newS.id);
    setConfig(newS.config);
    setProgress(newS.progress);
    setRound(null);
    setIsSetupOpen(true);
  };

  const handleSelectSession = (s: TriviaSessionRecord) => {
    writeActiveSessionId(s.id);
    setActiveId(s.id);
    setConfig(s.config);
    setProgress(s.progress);
    setRound(null);
    setIsSetupOpen(s.config.deck.length === 0);
  };

  const handleRenameSession = (id: string, newName: string) => {
    updateSession(id, { name: newName });
    setSessions(readTriviaSessions());
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    const remaining = readTriviaSessions();
    setSessions(remaining);
    const nextActive = readActiveSessionId();
    setActiveId(nextActive);
    if (nextActive === null) {
      const freshConfig = readTriviaConfig();
      const freshProgress = readTriviaProgress();
      setConfig(freshConfig);
      setProgress(freshProgress);
      setRound(null);
      setIsSetupOpen(true);
    }
  };

  const activeTitle =
    round === null ? '' : getAlgorithm(round.algorithmId)?.title ?? round.algorithmId;

  return (
    <div style={pageStyle}>
      {/* Top Header Card */}
      <TriviaHeaderCard
        activeSession={activeSession}
        level={level}
        config={config}
        progress={progress}
        sourcesCount={sources.size}
        coverage={coverage}
        showSetup={showSetup}
        isDeckEmpty={isDeckEmpty}
        onToggleSetup={() => {
          if (showSetup) {
            setIsSetupOpen(false);
            if (activeId) {
              updateSession(activeId, { status: 'active' });
              setSessions(readTriviaSessions());
            }
          } else {
            setIsSetupOpen(true);
          }
        }}
        onCreateNewSession={handleCreateNewSession}
        onOpenReset={() => setIsResetOpen(true)}
      />

      {/* Saved Sessions Bar */}
      <TriviaSessionsManager
        sessions={sessions}
        activeId={activeId}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      {showSetup ? (
        <>
          {isDeckEmpty && (
            <span style={hintStyle}>
              Add at least one algorithm to the deck to start drilling.
            </span>
          )}
          <div style={setupGridStyle}>
            <TriviaDeckBuilder deck={config.deck} onChange={(deck) => applyConfig({ deck })} />
            <TriviaSettings config={config} onChange={applyConfig} />
          </div>
        </>
      ) : (
        <>
          {progress.completed ? (
            <TriviaCompletionCard sourcesCount={sources.size} maxBlanks={config.maxBlanks} />
          ) : null}

          {round !== null ? (
            <TriviaSession
              round={round}
              algorithmTitle={activeTitle}
              mode={config.mode}
              onSubmit={handleSubmit}
              onNext={handleNext}
              onPause={handlePause}
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
