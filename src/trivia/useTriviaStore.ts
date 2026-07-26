import { create } from "zustand";
import type { TriviaConfig, TriviaProgress, TriviaSessionRecord } from "../types/trivia";
import {
  clearTrivia,
  cloneTriviaConfig,
  cloneTriviaProgress,
  readTriviaConfig,
  readTriviaProgress,
  writeTriviaConfig,
  writeTriviaProgress,
} from "./triviaStorage";
import {
  createSession,
  deleteSession,
  readActiveSessionId,
  readTriviaSessions,
  updateSession,
  writeActiveSessionId,
} from "./triviaSessions";

export interface TriviaStoreState {
  config: TriviaConfig;
  progress: TriviaProgress;
  sessions: TriviaSessionRecord[];
  activeSessionId: string | null;

  setConfig: (config: TriviaConfig) => void;
  setProgress: (progress: TriviaProgress) => void;
  updateConfig: (updater: (prev: TriviaConfig) => TriviaConfig) => void;
  updateProgress: (updater: (prev: TriviaProgress) => TriviaProgress) => void;

  createSession: (name?: string) => TriviaSessionRecord;
  setActiveSession: (id: string | null) => void;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
  clearAll: () => void;
  refreshFromStorage: () => void;
}

export const useTriviaStore = create<TriviaStoreState>((set, get) => ({
  config: readTriviaConfig(),
  progress: readTriviaProgress(),
  sessions: readTriviaSessions(),
  activeSessionId: readActiveSessionId(),

  setConfig: (config: TriviaConfig) => {
    writeTriviaConfig(config);
    set({ config });
    const { activeSessionId } = get();
    if (activeSessionId) {
      updateSession(activeSessionId, { config });
      set({ sessions: readTriviaSessions() });
    }
  },

  setProgress: (progress: TriviaProgress) => {
    writeTriviaProgress(progress);
    set({ progress });
    const { activeSessionId } = get();
    if (activeSessionId) {
      updateSession(activeSessionId, { progress });
      set({ sessions: readTriviaSessions() });
    }
  },

  updateConfig: (updater: (prev: TriviaConfig) => TriviaConfig) => {
    const current = get().config;
    const nextConfig = updater(cloneTriviaConfig(current));
    writeTriviaConfig(nextConfig);
    set({ config: nextConfig });
    const { activeSessionId } = get();
    if (activeSessionId) {
      updateSession(activeSessionId, { config: nextConfig });
      set({ sessions: readTriviaSessions() });
    }
  },

  updateProgress: (updater: (prev: TriviaProgress) => TriviaProgress) => {
    const current = get().progress;
    const nextProgress = updater(cloneTriviaProgress(current));
    writeTriviaProgress(nextProgress);
    set({ progress: nextProgress });
    const { activeSessionId } = get();
    if (activeSessionId) {
      updateSession(activeSessionId, { progress: nextProgress });
      set({ sessions: readTriviaSessions() });
    }
  },

  createSession: (name?: string) => {
    const newSession = createSession(name);
    set({
      config: newSession.config,
      progress: newSession.progress,
      activeSessionId: newSession.id,
      sessions: readTriviaSessions(),
    });
    return newSession;
  },

  setActiveSession: (id: string | null) => {
    writeActiveSessionId(id);
    const sessions = readTriviaSessions();
    const target = id ? sessions.find((s) => s.id === id) : null;
    if (target) {
      writeTriviaConfig(target.config);
      writeTriviaProgress(target.progress);
      set({
        activeSessionId: id,
        config: target.config,
        progress: target.progress,
        sessions,
      });
    } else {
      set({ activeSessionId: id, sessions });
    }
  },

  renameSession: (id: string, name: string) => {
    updateSession(id, { name });
    set({ sessions: readTriviaSessions() });
  },

  deleteSession: (id: string) => {
    deleteSession(id);
    set({
      sessions: readTriviaSessions(),
      activeSessionId: readActiveSessionId(),
      config: readTriviaConfig(),
      progress: readTriviaProgress(),
    });
  },

  clearAll: () => {
    clearTrivia();
    set({
      config: readTriviaConfig(),
      progress: readTriviaProgress(),
      sessions: readTriviaSessions(),
      activeSessionId: null,
    });
  },

  refreshFromStorage: () => {
    set({
      config: readTriviaConfig(),
      progress: readTriviaProgress(),
      sessions: readTriviaSessions(),
      activeSessionId: readActiveSessionId(),
    });
  },
}));
