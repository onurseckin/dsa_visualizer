import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Home, SlidersHorizontal } from 'lucide-react';
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaProgress,
  TriviaRound,
  TriviaScreen,
  TriviaSessionRecord,
} from '../types/trivia';
import {
  blankableLines,
  coverageRatio,
  gradeRound,
  isLevelCovered,
  normalizeConfig,
  parsePuzzleLines,
  pickRound,
  recordRound,
} from '../trivia/triviaEngine';
import {
  createSession,
  deleteSession,
  loadTriviaBootstrap,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from '../trivia/triviaSessions';
import {
  MAX_PANEL_HEIGHT_PX,
  MIN_PANEL_HEIGHT_PX,
  TRIVIA_LAYOUT_RESET_EVENT,
  readTriviaLayout,
  writeTriviaLayout,
} from '../trivia/triviaLayout';
import type { TriviaLayout, TriviaPanelHeights } from '../trivia/triviaLayout';
import { DragHandle, usePointerDrag } from '../components/ResizableLayout';
import { getAlgorithm } from '../algorithms/registry';
import { Button, Card } from '../ui';
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
  minHeight: 0,
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

/* Pins one Setup-screen panel's height with its own DragHandle — the same
   standalone-pinned-section pattern TriviaSession.tsx uses for its
   problem/puzzle rows (which itself mirrors MainLayout's `stage` row), not
   routed through ResizableRows' viewport-bound column algorithm since this
   route is a naturally-scrolling page (TASKS.md 9.8). */
function usePinnedPanelHeight(
  pinned: number | null,
  applyPanelHeights: (patch: Partial<TriviaPanelHeights>, commit: boolean) => void,
  buildPatch: (value: number | null) => Partial<TriviaPanelHeights>,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const dragTo = useCallback(
    (_x: number, y: number) => {
      const top = ref.current?.getBoundingClientRect().top;
      if (top === undefined) return;
      applyPanelHeights(buildPatch(y - top), false);
    },
    [applyPanelHeights, buildPatch],
  );

  const endDrag = useCallback(() => {
    setDragging(false);
    applyPanelHeights(buildPatch(pinnedRef.current), true);
  }, [applyPanelHeights, buildPatch]);

  usePointerDrag(dragging, dragTo, endDrag);

  const nudge = useCallback(
    (delta: number) => {
      const current = pinnedRef.current ?? ref.current?.getBoundingClientRect().height ?? 0;
      applyPanelHeights(buildPatch(current + delta), true);
    },
    [applyPanelHeights, buildPatch],
  );

  const restoreDefault = useCallback(() => {
    applyPanelHeights(buildPatch(null), true);
  }, [applyPanelHeights, buildPatch]);

  return { ref, dragging, setDragging, nudge, restoreDefault };
}

const buildSessionListPatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  sessionList: value,
});
const buildDeckBuilderPatch = (value: number | null): Partial<TriviaPanelHeights> => ({
  deckBuilder: value,
});
const buildSettingsPatch = (value: number | null): Partial<TriviaPanelHeights> => ({ settings: value });

function TriviaPage() {
  const navigate = useNavigate();

  /* The one bootstrap read: zero sessions is a legitimate, permanent state
     now (Home's own empty state) — nothing here manufactures a session just
     so the page has something to render (TASKS.md 9.1). */
  const [bootstrap] = useState(loadTriviaBootstrap);
  const [sessions, setSessions] = useState<TriviaSessionRecord[]>(bootstrap.sessions);
  /* The one fact that decides the screen: null is Home, a real id is
     Setup/Drill (chosen below by that session's own lastScreen). Never a
     third hand-set flag alongside it. */
  const [activeSessionId, setActiveSessionId] = useState<string | null>(bootstrap.activeId);

  const activeSession: TriviaSessionRecord | null = useMemo(
    () => (activeSessionId === null ? null : sessions.find((s) => s.id === activeSessionId) ?? null),
    [sessions, activeSessionId]
  );

  const config = activeSession?.config ?? null;
  const progress = activeSession?.progress ?? null;

  const [round, setRound] = useState<TriviaRound | null>(null);

  const { sources, meta } = useMemo<DeckSources>(() => {
    const nextSources = new Map<string, PuzzleLine[]>();
    const nextMeta = new Map<string, TriviaMeta | undefined>();
    (config?.deck ?? []).forEach((id) => {
      const algorithm = getAlgorithm(id);
      if (algorithm === undefined) return;
      nextSources.set(id, parsePuzzleLines(algorithm.code, algorithm.trivia));
      nextMeta.set(id, algorithm.trivia);
    });
    return { sources: nextSources, meta: nextMeta };
  }, [config]);

  const deckLineCounts = useMemo(
    () => [...sources.values()].map((lines) => blankableLines(lines).length),
    [sources]
  );

  const isDeckEmpty = activeSession !== null && sources.size === 0;

  /* Screen is always derived, never hand-set: null session -> Home; a forced
     Setup while the deck is empty (there is nothing to drill yet); otherwise
     whichever screen the session's own lastScreen names (TASKS.md 9.1). */
  const screen: TriviaScreen | 'home' =
    activeSession === null ? 'home' : isDeckEmpty ? 'setup' : activeSession.lastScreen;

  const level =
    round?.level ?? Math.min(Math.max(progress?.level ?? 1, config?.minBlanks ?? 1), config?.maxBlanks ?? 1);
  const coverage =
    config && progress ? Math.round(coverageRatio(progress, sources, config) * 100) : 0;

  useEffect(() => {
    if (round !== null && !sources.has(round.algorithmId)) setRound(null);
  }, [round, sources]);

  useEffect(() => {
    if (screen !== 'drill' || round !== null || !config || !progress || progress.completed) return;
    setRound(pickRound({ config, progress, sources, meta }));
  }, [screen, round, config, progress, sources, meta]);

  /* Every mutation is one updateSession(activeId, patch) call, then a resync
      of the sessions list — never a bare storage write plus a session patch. */
  const applySessionPatch = (patch: Partial<Omit<TriviaSessionRecord, 'id'>>) => {
    if (activeSessionId === null) return;
    updateSession(activeSessionId, patch);
    setSessions(readTriviaSessions());
  };

  const applyConfig = (patch: Partial<TriviaConfig>) => {
    if (!config || !progress) return;
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
    if (round === null || !config || !progress) return;
    const grade = gradeRound(round, answers);
    const updatedProgress = recordRound(progress, round, grade, config, sources);
    applySessionPatch({ progress: updatedProgress });
    // Same tick as the mutation: a completed deck never renders the
    // completion card and a live round at once.
    if (updatedProgress.completed) setRound(null);
  };

  const handleNext = () => {
    if (!config || !progress) return;
    setRound(pickRound({ config, progress, sources, meta }));
  };

  const handleStartDrilling = () => {
    applySessionPatch({ lastScreen: 'drill' });
    setRound(null);
  };

  /** "Edit deck & settings" (TASKS.md 9.1): same session stays active, only
      the screen changes — never touches progress. Also the completion
      card's only way back in. */
  const handleEditSettings = () => {
    applySessionPatch({ lastScreen: 'setup' });
    setRound(null);
  };

  /** "Back to Trivia Home" — the one unambiguous exit, from either screen.
      `fromScreen` records which screen to land Resume back on later, so the
      session's own state survives the round-trip through Home exactly as
      the user left it. */
  const handleBackToHome = (fromScreen: TriviaScreen) => {
    applySessionPatch({ lastScreen: fromScreen });
    writeActiveSessionId(null);
    setActiveSessionId(null);
    setRound(null);
  };

  const handleCreateNewSession = () => {
    const created = createSession();
    setSessions(readTriviaSessions());
    setActiveSessionId(created.id);
    setRound(null);
  };

  const handleResumeSession = (session: TriviaSessionRecord) => {
    writeActiveSessionId(session.id);
    setActiveSessionId(session.id);
    setRound(null);
  };

  const handleRenameSession = (id: string, newName: string) => {
    updateSession(id, { name: newName });
    setSessions(readTriviaSessions());
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    setSessions(readTriviaSessions());
  };

  const handleStudyInWorkspace = (algorithmId?: string) => {
    const targetId = algorithmId ?? round?.algorithmId ?? config?.deck[0] ?? 'bubble-sort';
    navigate({ to: '/workspace/$algorithmId', params: { algorithmId: targetId } });
  };

  const activeTitle =
    round === null ? '' : getAlgorithm(round.algorithmId)?.title ?? round.algorithmId;

  /* Resizable, persisted trivia layout (TASKS.md 9.8): the Setup screen's
     deck-builder/settings row heights, mirroring how TriviaSession owns the
     same TriviaLayout record for the Drill screen's rows. */
  const [layout, setLayout] = useState<TriviaLayout>(() => readTriviaLayout());
  const layoutRef = useRef<TriviaLayout>(layout);
  layoutRef.current = layout;

  useEffect(() => {
    const reload = () => setLayout(readTriviaLayout());
    window.addEventListener(TRIVIA_LAYOUT_RESET_EVENT, reload);
    return () => window.removeEventListener(TRIVIA_LAYOUT_RESET_EVENT, reload);
  }, []);

  const applyPanelHeights = useCallback((patch: Partial<TriviaPanelHeights>, commit: boolean) => {
    if (!commit) {
      setLayout((prev) => ({ ...prev, panelHeights: { ...prev.panelHeights, ...patch } }));
      return;
    }
    setLayout(
      writeTriviaLayout({
        puzzleSplitPercent: layoutRef.current.puzzleSplitPercent,
        panelHeights: { ...layoutRef.current.panelHeights, ...patch },
      }),
    );
  }, []);

  const sessionListPanel = usePinnedPanelHeight(
    layout.panelHeights.sessionList,
    applyPanelHeights,
    buildSessionListPatch,
  );
  const deckBuilderPanel = usePinnedPanelHeight(
    layout.panelHeights.deckBuilder,
    applyPanelHeights,
    buildDeckBuilderPatch,
  );
  const settingsPanel = usePinnedPanelHeight(
    layout.panelHeights.settings,
    applyPanelHeights,
    buildSettingsPatch,
  );

  return (
    <div style={pageStyle}>
      {screen === 'home' ? (
        <>
          {/* Home gets the same pinned-height + DragHandle treatment as every
              other trivia panel (TASKS.md 9.8: "I want this width and height
              adjustment on sections supported inside of trivia sections as
              well, like the trivia main page"). It is the only panel on this
              screen, so there is nothing to divide space *against* — the
              handle still lets a user pin its height and have that height
              survive a reload, exactly like deckBuilder/settings below. */}
          <div
            ref={sessionListPanel.ref}
            style={{
              flexShrink: 0,
              minHeight: 0,
              height:
                layout.panelHeights.sessionList !== null
                  ? `${layout.panelHeights.sessionList}px`
                  : undefined,
              overflow: layout.panelHeights.sessionList !== null ? 'auto' : 'visible',
            }}
          >
            <TriviaSessionsManager
              sessions={sessions}
              onCreateNewSession={handleCreateNewSession}
              onResumeSession={handleResumeSession}
              onRenameSession={handleRenameSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>

          <DragHandle
            orientation="horizontal"
            label="Resize the trivia session list"
            valueNow={layout.panelHeights.sessionList ?? MIN_PANEL_HEIGHT_PX}
            valueMin={MIN_PANEL_HEIGHT_PX}
            valueMax={MAX_PANEL_HEIGHT_PX}
            valueText={
              layout.panelHeights.sessionList === null ? 'Automatic, sized to content' : undefined
            }
            step={16}
            dragging={sessionListPanel.dragging}
            onDragStart={() => sessionListPanel.setDragging(true)}
            onNudge={sessionListPanel.nudge}
            onRestoreDefault={sessionListPanel.restoreDefault}
          />
        </>
      ) : activeSession && config && progress ? (
        screen === 'setup' ? (
          <>
            <TriviaHeaderCard
              activeSession={activeSession}
              level={level}
              config={config}
              progress={progress}
              sourcesCount={sources.size}
              coverage={coverage}
              isDeckEmpty={isDeckEmpty}
              onStartDrilling={handleStartDrilling}
              onBackToHome={() => handleBackToHome('setup')}
              onRenameSession={handleRenameSession}
            />

            {isDeckEmpty && (
              <span style={hintStyle}>
                Add at least one algorithm to the deck to start drilling.
              </span>
            )}

            {/* Single-column stack — drill settings above the deck builder,
                so the settings a learner needs before picking algorithms are
                the first thing on screen rather than buried below a
                potentially long algorithm list (a user reported never
                realising settings existed at all). No side-by-side region to
                divide (TASKS.md 9.8), so height-only resizing suffices. */}
            <div
              ref={settingsPanel.ref}
              style={{
                flexShrink: 0,
                height:
                  layout.panelHeights.settings !== null ? `${layout.panelHeights.settings}px` : undefined,
                overflow: layout.panelHeights.settings !== null ? 'auto' : 'visible',
              }}
            >
              <TriviaSettings config={config} onChange={applyConfig} deckLineCounts={deckLineCounts} />
            </div>

            <DragHandle
              orientation="horizontal"
              label="Resize drill settings and deck builder"
              valueNow={layout.panelHeights.settings ?? MIN_PANEL_HEIGHT_PX}
              valueMin={MIN_PANEL_HEIGHT_PX}
              valueMax={MAX_PANEL_HEIGHT_PX}
              valueText={
                layout.panelHeights.settings === null ? 'Automatic, sized to content' : undefined
              }
              step={16}
              dragging={settingsPanel.dragging}
              onDragStart={() => settingsPanel.setDragging(true)}
              onNudge={settingsPanel.nudge}
              onRestoreDefault={settingsPanel.restoreDefault}
            />

            <div
              ref={deckBuilderPanel.ref}
              style={{
                flexShrink: 0,
                height:
                  layout.panelHeights.deckBuilder !== null
                    ? `${layout.panelHeights.deckBuilder}px`
                    : undefined,
                overflow: layout.panelHeights.deckBuilder !== null ? 'auto' : 'visible',
              }}
            >
              <TriviaDeckBuilder deck={config.deck} onChange={(deck) => applyConfig({ deck })} />
            </div>
          </>
        ) : progress.completed ? (
          <>
            <TriviaCompletionCard sourcesCount={sources.size} maxBlanks={config.maxBlanks} />
            {/* The completion card has no controls of its own. Two distinct
                actions, never one overloaded button (TASKS.md 9.1): editing
                settings to keep going stays in this session, while Back to
                Trivia Home is the unambiguous exit — this screen is still
                reached with lastScreen: 'drill', so without its own exit a
                finished session had no way out except detouring through
                Setup first. */}
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                size="sm"
                variant="secondary"
                icon={<SlidersHorizontal aria-hidden="true" />}
                onClick={handleEditSettings}
              >
                Adjust settings to keep going
              </Button>
              <Button
                size="sm"
                variant="secondary"
                icon={<Home aria-hidden="true" />}
                onClick={() => handleBackToHome('drill')}
              >
                Back to Trivia Home
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
            onEditSettings={handleEditSettings}
            onBackToHome={() => handleBackToHome('drill')}
            onStudyInWorkspace={handleStudyInWorkspace}
            hints={meta.get(round.algorithmId)?.hints}
            lineExplanations={meta.get(round.algorithmId)?.lineExplanations}
          />
        ) : (
          <Card style={PANEL_BORDER} title="Nothing to drill at this level">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <span style={hintStyle}>
                {`No algorithm in the deck has ${level} lines to hide at once. Add a longer solution or lower the hardest level in the deck setup.`}
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<SlidersHorizontal aria-hidden="true" />}
                  onClick={handleEditSettings}
                >
                  Edit deck & settings
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Home aria-hidden="true" />}
                  onClick={() => handleBackToHome('drill')}
                >
                  Back to Trivia Home
                </Button>
              </div>
            </div>
          </Card>
        )
      ) : null}
    </div>
  );
}
