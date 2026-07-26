import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Brain, Play, Plus, RotateCcw, Trash2, Trophy, Edit2, Check as CheckIcon } from 'lucide-react';
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
import { Badge, Button, Card, ConfirmDialog, Input } from '../ui';
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
  const [sessions, setSessions] = useState<TriviaSessionRecord[]>(readTriviaSessions);
  const [activeId, setActiveId] = useState<string | null>(readActiveSessionId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

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

  // Sync state when activeSession changes
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

  const handleStartRename = (s: TriviaSessionRecord) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim().length > 0) {
      updateSession(id, { name: editingName.trim() });
      setSessions(readTriviaSessions());
    }
    setEditingId(null);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeSession ? activeSession.name : 'Trivia'}
            </span>
            {activeSession && (
              <Badge variant={activeSession.status === 'paused' ? 'warning' : 'success'} size="sm">
                {activeSession.status}
              </Badge>
            )}
          </div>
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

            {/* Top Primary Action: Start / Resume / Setup */}
            <Button
              variant="primary"
              size="md"
              icon={<Play aria-hidden="true" />}
              disabled={isDeckEmpty}
              onClick={() => {
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
            >
              {showSetup ? 'Start drilling' : 'Edit deck'}
            </Button>

            <Button
              size="md"
              variant="secondary"
              icon={<Plus aria-hidden="true" />}
              onClick={handleCreateNewSession}
            >
              New session
            </Button>

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

      {/* Saved / Resumable Sessions Bar */}
      {sessions.length > 0 && (
        <Card style={PANEL_BORDER} title="Saved Trivia Sessions" padding="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={hintStyle}>
              Select a pending session to resume where you left off, or create new named trivia decks.
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {sessions.map((s) => {
                const isCurrent = s.id === activeId;
                const isEditing = editingId === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'var(--bg-inset)' : 'transparent',
                      border: `1px solid ${isCurrent ? 'var(--border-accent)' : 'var(--border-default)'}`,
                    }}
                  >
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <Input
                          size="sm"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(s.id);
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<CheckIcon size={14} />}
                          onClick={() => handleSaveRename(s.id)}
                        />
                      </div>
                    ) : (
                      <>
                        <span
                          style={{
                            fontWeight: isCurrent ? 600 : 400,
                            color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontSize: 'var(--text-sm)',
                          }}
                        >
                          {s.name}
                        </span>
                        <Badge size="sm" variant={s.status === 'paused' ? 'warning' : 'neutral'}>
                          {s.config.deck.length} algos
                        </Badge>
                        <Button
                          size="sm"
                          variant={isCurrent ? 'primary' : 'secondary'}
                          onClick={() => handleSelectSession(s)}
                        >
                          {isCurrent ? 'Active' : 'Resume'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Edit2 size={14} />}
                          onClick={() => handleStartRename(s)}
                          aria-label={`Rename ${s.name}`}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleDeleteSession(s.id)}
                          aria-label={`Delete ${s.name}`}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

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
