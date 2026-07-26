import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaMeta,
  TriviaRound,
  TriviaScreen,
  TriviaSessionRecord,
} from "../../../types/trivia";
import {
  blankableLines,
  coverageRatio,
  gradeRound,
  normalizeConfig,
  parsePuzzleLines,
  pickRound,
  recordRound,
} from "../../../trivia/triviaEngine";
import {
  createSession,
  deleteSession,
  loadTriviaBootstrap,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from "../../../trivia/triviaSessions";
import { getAlgorithm } from "../../../algorithms/registry";
import { DeckSources, reviveProgressForConfig } from "../-triviaPageUtils";
import { useTriviaPageLayout } from "./useTriviaPageLayout";

export function useTriviaPage() {
  const navigate = useNavigate();

  const [bootstrap] = useState(loadTriviaBootstrap);
  const [sessions, setSessions] = useState<TriviaSessionRecord[]>(bootstrap.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(bootstrap.activeId);

  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const activeSession: TriviaSessionRecord | null = useMemo(
    () => (activeSessionId === null ? null : (sessionMap.get(activeSessionId) ?? null)),
    [sessionMap, activeSessionId],
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
    [sources],
  );

  const isDeckEmpty = activeSession !== null && sources.size === 0;

  const screen: TriviaScreen | "home" =
    activeSession === null ? "home" : isDeckEmpty ? "setup" : activeSession.lastScreen;

  const level =
    round?.level ??
    Math.min(Math.max(progress?.level ?? 1, config?.minBlanks ?? 1), config?.maxBlanks ?? 1);
  const coverage =
    config && progress ? Math.round(coverageRatio(progress, sources, config) * 100) : 0;

  useEffect(() => {
    if (round !== null && !sources.has(round.algorithmId)) setRound(null);
  }, [round, sources]);

  useEffect(() => {
    if (screen !== "drill" || round !== null || !config || !progress || progress.completed) return;
    setRound(pickRound({ config, progress, sources, meta }));
  }, [screen, round, config, progress, sources, meta]);

  const applySessionPatch = (patch: Partial<Omit<TriviaSessionRecord, "id">>) => {
    if (activeSessionId === null) return;
    updateSession(activeSessionId, patch);
    setSessions(readTriviaSessions());
  };

  const applyConfig = (patch: Partial<TriviaConfig>) => {
    if (!config || !progress) return;
    const nextConfig = normalizeConfig({ ...config, ...patch });
    const nextProgress = reviveProgressForConfig(progress, nextConfig);
    applySessionPatch(
      nextProgress === progress
        ? { config: nextConfig }
        : { config: nextConfig, progress: nextProgress },
    );
  };

  const handleSubmit = (answers: Record<number, string>) => {
    if (round === null || !config || !progress) return;
    const grade = gradeRound(round, answers);
    const updatedProgress = recordRound(progress, round, grade, config, sources);
    applySessionPatch({ progress: updatedProgress });
    if (updatedProgress.completed) setRound(null);
  };

  const handleNext = () => {
    if (!config || !progress) return;
    setRound(pickRound({ config, progress, sources, meta }));
  };

  const handleStartDrilling = () => {
    applySessionPatch({ lastScreen: "drill" });
    setRound(null);
  };

  const handleEditSettings = () => {
    applySessionPatch({ lastScreen: "setup" });
    setRound(null);
  };

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
    const targetId = algorithmId ?? round?.algorithmId ?? config?.deck[0] ?? "bubble-sort";
    navigate({ to: "/workspace/$algorithmId", params: { algorithmId: targetId } });
  };

  const activeTitle =
    round === null ? "" : (getAlgorithm(round.algorithmId)?.title ?? round.algorithmId);

  const { layout, sessionListPanel, deckBuilderPanel, settingsPanel } = useTriviaPageLayout();

  return {
    sessions,
    activeSession,
    config,
    progress,
    round,
    screen,
    level,
    coverage,
    sources,
    meta,
    deckLineCounts,
    isDeckEmpty,
    activeTitle,
    layout,
    sessionListPanel,
    deckBuilderPanel,
    settingsPanel,
    applyConfig,
    handleSubmit,
    handleNext,
    handleStartDrilling,
    handleEditSettings,
    handleBackToHome,
    handleCreateNewSession,
    handleResumeSession,
    handleRenameSession,
    handleDeleteSession,
    handleStudyInWorkspace,
  };
}
