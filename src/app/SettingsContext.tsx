import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ViewMode } from '../types/dsa';

const STORAGE_PREFIX = 'dsa_visualizer_';

/* localStorage can throw (private browsing, quota, disabled storage) and can
   contain stale/garbage JSON — reads validate and fall back, writes are
   best-effort so in-memory state stays authoritative. */
function readStored<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: ViewMode | boolean | string): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; failing to write must never break the UI.
  }
}

const isViewMode = (value: unknown): value is ViewMode =>
  value === 'split' || value === 'visual' || value === 'code';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isString = (value: unknown): value is string => typeof value === 'string';

export interface SettingsContextValue {
  viewMode: ViewMode;
  showTutorial: boolean;
  showAuxiliary: boolean;
  soundEnabled: boolean;
  lastAlgorithmId: string;
  setViewMode: (mode: ViewMode) => void;
  setShowTutorial: (show: boolean) => void;
  setShowAuxiliary: (show: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setLastAlgorithmId: (id: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() =>
    readStored('view_mode', 'split', isViewMode)
  );
  const [showTutorial, setShowTutorialState] = useState<boolean>(() =>
    readStored('show_tutorial', true, isBoolean)
  );
  const [showAuxiliary, setShowAuxiliaryState] = useState<boolean>(() =>
    readStored('show_auxiliary', true, isBoolean)
  );
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() =>
    readStored('sound_enabled', true, isBoolean)
  );
  const [lastAlgorithmId, setLastAlgorithmIdState] = useState<string>(() =>
    readStored('last_algorithm_id', 'bubble-sort', isString)
  );

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    writeStored('view_mode', mode);
  }, []);

  const setShowTutorial = useCallback((show: boolean) => {
    setShowTutorialState(show);
    writeStored('show_tutorial', show);
  }, []);

  const setShowAuxiliary = useCallback((show: boolean) => {
    setShowAuxiliaryState(show);
    writeStored('show_auxiliary', show);
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    writeStored('sound_enabled', enabled);
  }, []);

  const setLastAlgorithmId = useCallback((id: string) => {
    setLastAlgorithmIdState(id);
    writeStored('last_algorithm_id', id);
  }, []);

  const value = useMemo(
    () => ({
      viewMode,
      showTutorial,
      showAuxiliary,
      soundEnabled,
      lastAlgorithmId,
      setViewMode,
      setShowTutorial,
      setShowAuxiliary,
      setSoundEnabled,
      setLastAlgorithmId,
    }),
    [
      viewMode,
      showTutorial,
      showAuxiliary,
      soundEnabled,
      lastAlgorithmId,
      setViewMode,
      setShowTutorial,
      setShowAuxiliary,
      setSoundEnabled,
      setLastAlgorithmId,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
