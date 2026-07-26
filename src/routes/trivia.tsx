import React, { useEffect, useMemo, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Layers } from 'lucide-react';
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaProgress,
  TriviaRound,
  TriviaSessionRecord,
  TriviaSessionStatus,
} from '../types/trivia';
import {
  DEFAULT_TRIVIA_CONFIG,
  coverageRatio,
  createProgress,
  gradeRound,
  isLevelCovered,
  normalizeConfig,
  parsePuzzleLines,
  pickRound,
  recordRound,
} from '../trivia/triviaEngine';
import { clearTrivia } from '../trivia/triviaStorage';
import {
  createSession,
  deleteSession,
  ensureActiveSession,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from '../trivia/triviaSessions';
import { getAlgorithm } from '../algorithms/registry';
import { Button, Card, ConfirmDialog } from '../ui';
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

const topBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
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

/* Status is never hand-set: it is always the direct image of isSetupOpen, so
   the "Active"/"Paused" badge can never say something the page isn't doing. */
const sessionStatusFor = (setupOpen: boolean): TriviaSessionStatus =>
  setupOpen ? 'paused' : 'active';

/**
 * `progress.completed` only ever means "nothing left at the config it was
 * recorded under." Raise the ceiling, or add a fresh algorithm to the deck,
 * and there is real material left to drill — so completion has to be
 * re-checked against the *new* config on every settings change, otherwise a
 * finished session is stuck on the completion card forever with no way back
 * in, even after the user raises the hardest level specifically to keep
 * going (the user's own words: "I should be able to change the session
 * settings and increase the level further" without losing progress).
 *
 * Returns the exact same `priorProgress` reference when nothing needs to
 * change, so callers can tell "revived" apart from "untouched" without a
 * deep-equality check — see `applyConfig` below, which depends on that to
 * keep a pure settings edit from ever patching `progress` at all.
 */
const reviveProgressForConfig = (
  priorProgress: TriviaProgress,
  nextConfig: TriviaConfig
): TriviaProgress => {
  if (!priorProgress.completed) return priorProgress;

  const nextSources = new Map<string, PuzzleLine[]>();
  nextConfig.deck.forEach((id) => {
    const algorithm = getAlgorithm(id);
    if (algorithm === undefined) return;
    nextSources.set(id, parsePuzzleLines(algorithm.code, algorithm.trivia));
  });
  if (nextSources.size === 0) return priorProgress;

  for (let lvl = nextConfig.minBlanks; lvl <= nextConfig.maxBlanks; lvl++) {
    if (!isLevelCovered(priorProgress, nextSources, lvl)) {
      return { ...priorProgress, completed: false, level: lvl };
    }
  }
  // Every level in the new range is still covered too (e.g. the ceiling was
  // lowered, or nothing that matters changed) — genuinely still complete.
  return priorProgress;
};

function TriviaPage() {
  const navigate = useNavigate();

  /* The one bootstrap read: guarantees a session exists (seeding it from any
     pre-session bare-key progress on first visit) before the first render, so
     nothing downstream ever has to handle "no session selected". */
  const [bootstrap] = useState(ensureActiveSession);
  const [sessions, setSessions] = useState<TriviaSessionRecord[]>(bootstrap.sessions);
  const [activeId, setActiveId] = useState<string>(bootstrap.active.id);

  const activeSession = useMemo<TriviaSessionRecord>(
    () => sessions.find((s) => s.id === activeId) ?? sessions[0],
    [sessions, activeId]
  );

  // Session is the only unit of state — config/progress are read straight off
  // it every render rather than mirrored into their own useState.
  const config = activeSession.config;
  const progress = activeSession.progress;

  const [round, setRound] = useState<TriviaRound | null>(null);
  // Matches handleSelectSession's formula: a session left mid-setup (status
  // 'paused') must reopen on setup, not just one whose deck happens to be
  // empty — otherwise reloading the page after "Exit to setup" throws the
  // learner straight back into a freshly generated drill round.
  const [isSetupOpen, setIsSetupOpen] = useState(
    () => bootstrap.active.config.deck.length === 0 || bootstrap.active.status !== 'active'
  );
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

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

  const canReset =
    progress.roundsPlayed > 0 || coverage > 0 || Object.keys(progress.drilled).length > 0;

  useEffect(() => {
    if (round !== null && !sources.has(round.algorithmId)) setRound(null);
  }, [round, sources]);

  useEffect(() => {
    if (showSetup || round !== null || progress.completed || isDeckEmpty) return;
    setRound(pickRound({ config, progress, sources, meta }));
  }, [showSetup, round, progress, config, sources, meta, isDeckEmpty]);

  /** Every mutation is one updateSession(activeId, patch) call, then a resync
      of the sessions list — never a bare storage write plus a session patch. */
  const applySessionPatch = (patch: Partial<Omit<TriviaSessionRecord, 'id'>>) => {
    updateSession(activeId, patch);
    setSessions(readTriviaSessions());
  };

  const applyConfig = (patch: Partial<TriviaConfig>) => {
    const nextConfig = normalizeConfig({ ...config, ...patch });
    const nextProgress = reviveProgressForConfig(progress, nextConfig);
    // Same-reference check, not a value comparison: reviveProgressForConfig
    // returns priorProgress itself when nothing needs reviving, so an
    // ordinary settings change (the common case) sends only { config } —
    // progress.drilled/.stats/.level are never even named in the patch.
    applySessionPatch(
      nextProgress === progress
        ? { config: nextConfig }
        : { config: nextConfig, progress: nextProgress }
    );
  };

  const handleSubmit = (answers: Record<number, string>) => {
    if (round === null) return;
    const grade = gradeRound(round, answers);
    const updatedProgress = recordRound(progress, round, grade, config, sources);
    applySessionPatch({ progress: updatedProgress });
    // Same tick as the mutation: a completed deck never renders the
    // completion card and a live round at once.
    if (updatedProgress.completed) setRound(null);
  };

  const handleNext = () => {
    setRound(pickRound({ config, progress, sources, meta }));
  };

  /** The one enter/exit handler. Every call performs all three steps —
      isSetupOpen flips, the round clears, and status derives from the new
      isSetupOpen — never two of three. TriviaHeaderCard's "Start drilling"
      and TriviaSession's "Exit to setup" both call this. */
  const handleToggleDrillMode = () => {
    const next = !isSetupOpen;
    setIsSetupOpen(next);
    setRound(null);
    applySessionPatch({ status: sessionStatusFor(next) });
  };

  const handleConfirmReset = () => {
    clearTrivia();
    applySessionPatch({
      config: DEFAULT_TRIVIA_CONFIG,
      progress: createProgress(DEFAULT_TRIVIA_CONFIG),
      status: sessionStatusFor(true),
    });
    setRound(null);
    setIsSetupOpen(true);
    setIsResetOpen(false);
  };

  const handleCreateNewSession = () => {
    const created = createSession();
    // A new session always lands on setup, so its status must say so too —
    // createSession's own default ('active') would otherwise let the badge
    // claim "Active" while the setup screen is what's actually on screen.
    updateSession(created.id, { status: sessionStatusFor(true) });
    setSessions(readTriviaSessions());
    setActiveId(created.id);
    setRound(null);
    setIsSetupOpen(true);
    setIsSessionsOpen(false);
  };

  const handleSelectSession = (s: TriviaSessionRecord) => {
    writeActiveSessionId(s.id);
    setActiveId(s.id);
    setRound(null);
    setIsSetupOpen(s.config.deck.length === 0 || s.status !== 'active');
    setIsSessionsOpen(false);
  };

  const handleRenameSession = (id: string, newName: string) => {
    updateSession(id, { name: newName });
    setSessions(readTriviaSessions());
  };

  const handleDeleteSession = (id: string) => {
    // The page never has a "no session selected" state, so the last
    // remaining session cannot be deleted — TriviaSessionsManager also
    // disables the control, this is the belt to that suspenders.
    if (sessions.length <= 1) return;
    deleteSession(id);
    const remaining = readTriviaSessions();
    setSessions(remaining);
    if (id === activeId) {
      const nextActiveId = readActiveSessionId() ?? remaining[0].id;
      const nextSession = remaining.find((s) => s.id === nextActiveId) ?? remaining[0];
      setActiveId(nextSession.id);
      setRound(null);
      setIsSetupOpen(nextSession.config.deck.length === 0 || nextSession.status !== 'active');
    }
  };

  const handleStudyInWorkspace = (algorithmId?: string) => {
    const targetId = algorithmId ?? round?.algorithmId ?? config.deck[0] ?? 'bubble-sort';
    navigate({ to: '/workspace/$algorithmId', params: { algorithmId: targetId } });
  };

  const activeTitle =
    round === null ? '' : getAlgorithm(round.algorithmId)?.title ?? round.algorithmId;

  return (
    <div style={pageStyle}>
      {/* Slim utility bar, present in both modes: the one door into the
          sessions popover so switching, renaming, deleting and creating
          sessions never costs permanent vertical space. */}
      <div style={topBarStyle}>
        <Button
          size="sm"
          variant="secondary"
          icon={<Layers aria-hidden="true" />}
          onClick={() => setIsSessionsOpen(true)}
        >
          {`Sessions · ${activeSession.name}`}
        </Button>
      </div>

      {showSetup ? (
        <>
          <TriviaHeaderCard
            activeSession={activeSession}
            level={level}
            config={config}
            progress={progress}
            sourcesCount={sources.size}
            coverage={coverage}
            isDeckEmpty={isDeckEmpty}
            onStartDrilling={handleToggleDrillMode}
            onRenameSession={handleRenameSession}
          />

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
      ) : progress.completed ? (
        <>
          <TriviaCompletionCard sourcesCount={sources.size} maxBlanks={config.maxBlanks} />
          {/* The completion card has no controls of its own — without this,
              a finished session is a dead end: raising maxBlanks to keep
              going (which the card's own copy invites) requires the setup
              screen, and nothing else on this branch can reach it. */}
          <div style={{ display: 'flex' }}>
            <Button
              size="sm"
              variant="secondary"
              icon={<ArrowLeft aria-hidden="true" />}
              onClick={handleToggleDrillMode}
            >
              Adjust settings to keep going
            </Button>
          </div>
        </>
      ) : round !== null ? (
        <TriviaSession
          round={round}
          algorithmTitle={activeTitle}
          mode={config.mode}
          level={level}
          coverage={coverage}
          onSubmit={handleSubmit}
          onNext={handleNext}
          onExitToSetup={handleToggleDrillMode}
          onStudyInWorkspace={handleStudyInWorkspace}
          hints={meta.get(round.algorithmId)?.hints}
          lineExplanations={meta.get(round.algorithmId)?.lineExplanations}
        />
      ) : (
        <Card style={PANEL_BORDER} title="Nothing to drill at this level">
          <span style={hintStyle}>
            {`No algorithm in the deck has ${level} lines to hide at once. Add a longer solution or lower the hardest level in the deck setup.`}
          </span>
        </Card>
      )}

      <TriviaSessionsManager
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
        sessions={sessions}
        activeId={activeId}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onCreateNewSession={handleCreateNewSession}
        onOpenReset={() => {
          setIsSessionsOpen(false);
          setIsResetOpen(true);
        }}
        canReset={canReset}
      />

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
