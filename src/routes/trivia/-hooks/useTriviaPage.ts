import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type {
  PuzzleLine,
  TriviaConfig,
  TriviaGrade,
  TriviaMeta,
  TriviaReviewSubmission,
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
  recordRetrievalReview,
} from "../../../trivia/triviaEngine";
import {
  createSession,
  deleteSession,
  loadTriviaBootstrap,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from "../../../trivia/triviaSessions";
import type { SourceKind } from "../../../types/dsa";
import { CODE_LEARNING_ITEMS, getLearningItem } from "../../../learning/registry";
import { isTriviaEligibleLearningItem } from "../../../learning/types";
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

  const [round, setRoundState] = useState<TriviaRound | null>(activeSession?.activeRound ?? null);
  const [lastGrade, setLastGrade] = useState<TriviaGrade | null>(null);

  const updateRound = useCallback(
    (nextRound: TriviaRound | null) => {
      setRoundState(nextRound);
      setLastGrade(null);
      if (activeSessionId !== null) {
        updateSession(activeSessionId, { activeRound: nextRound });
        setSessions(readTriviaSessions());
      }
    },
    [activeSessionId],
  );

  const { sources, meta } = useMemo<DeckSources>(() => {
    const nextSources = new Map<string, PuzzleLine[]>();
    const nextMeta = new Map<string, TriviaMeta | undefined>();
    (config?.deck ?? []).forEach((id) => {
      const item = getLearningItem(id);
      if (!item || !isTriviaEligibleLearningItem(item)) return;
      nextSources.set(id, parsePuzzleLines(item.code, item.trivia));
      nextMeta.set(id, item.trivia);
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
    if (round !== null && !sources.has(round.algorithmId)) {
      updateRound(null);
    } else if (
      round === null &&
      activeSession?.activeRound &&
      sources.has(activeSession.activeRound.algorithmId)
    ) {
      setRoundState(activeSession.activeRound);
    }
  }, [round, activeSession, sources, updateRound]);

  useEffect(() => {
    if (screen !== "drill" || round !== null || !config || !progress || progress.completed) return;
    const nextRound = pickRound({ config, progress, sources, meta });
    updateRound(nextRound);
  }, [screen, round, config, progress, sources, meta, updateRound]);

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
        ? { config: nextConfig, activeRound: null }
        : { config: nextConfig, progress: nextProgress, activeRound: null },
    );
    updateRound(null);
  };

  const handleSubmit = (answers: Record<number, string>) => {
    if (round === null || !config || !progress) return;
    const grade = gradeRound(round, answers);
    setLastGrade(grade);
    const updatedProgress = recordRound(progress, round, grade, config, sources);
    applySessionPatch({ progress: updatedProgress });
    if (updatedProgress.completed && round.retrievalPrompt === undefined) {
      updateRound(null);
    }
  };

  const handleReview = (submission: TriviaReviewSubmission) => {
    if (round === null || !progress || !lastGrade) return;
    applySessionPatch({
      progress: recordRetrievalReview(progress, round, lastGrade, submission, Date.now()),
    });
  };

  const handleNext = () => {
    if (!config || !progress) return;
    const nextRound = pickRound({ config, progress, sources, meta });
    updateRound(nextRound);
  };

  const handleStartDrilling = () => {
    applySessionPatch({ lastScreen: "drill" });
  };

  const handleEditSettings = () => {
    applySessionPatch({ lastScreen: "setup" });
  };

  const handleBackToHome = (fromScreen: TriviaScreen) => {
    applySessionPatch({ lastScreen: fromScreen });
    writeActiveSessionId(null);
    setActiveSessionId(null);
  };

  const handleCreateNewSession = () => {
    const created = createSession();
    setSessions(readTriviaSessions());
    setActiveSessionId(created.id);
  };

  const handleResumeSession = (session: TriviaSessionRecord) => {
    writeActiveSessionId(session.id);
    setActiveSessionId(session.id);
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

  const handleFilterDeckBySource = (sourceFilter: "ALL" | SourceKind) => {
    if (!config || !progress) return;
    const triviaItems = CODE_LEARNING_ITEMS.filter(isTriviaEligibleLearningItem);
    const filtered =
      sourceFilter === "ALL"
        ? triviaItems
        : triviaItems.filter((item) => item.sources.some((source) => source.kind === sourceFilter));
    applyConfig({ deck: filtered.map((item) => item.id) });
  };

  const activeTitle =
    round === null ? "" : (getLearningItem(round.algorithmId)?.title ?? round.algorithmId);

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
    handleReview,
    handleNext,
    handleStartDrilling,
    handleEditSettings,
    handleBackToHome,
    handleCreateNewSession,
    handleResumeSession,
    handleRenameSession,
    handleDeleteSession,
    handleStudyInWorkspace,
    handleFilterDeckBySource,
  };
}
