import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { PanelKey, PanelVisibility, ViewMode } from "../types/dsa";

const STORAGE_PREFIX = "dsa_visualizer_";

const PANEL_STORAGE_KEYS: Record<PanelKey, string> = {
  visualizer: "panel_visualizer",
  code: "panel_code",
  tutorial: "panel_tutorial",
  auxiliary: "panel_auxiliary",
};

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

function writeStored(key: string, value: boolean | string | number): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort; failing to write must never break the UI.
  }
}

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isString = (value: unknown): value is string => typeof value === "string";
const isLegacyViewMode = (value: unknown): value is ViewMode | null =>
  value === null || value === "split" || value === "visual" || value === "code";

/* Mirrors the ControlPanel Speed slider's own min/max (50-1000ms delay per
   step); an out-of-range or non-numeric stored value is exactly as
   untrustworthy as garbage JSON, so it falls back to the default rather than
   being clamped. */
export const MIN_PLAYBACK_SPEED_MS = 50;
export const MAX_PLAYBACK_SPEED_MS = 1000;
export const DEFAULT_PLAYBACK_SPEED_MS = 300;

const isPlaybackSpeed = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= MIN_PLAYBACK_SPEED_MS &&
  value <= MAX_PLAYBACK_SPEED_MS;

/* Builds before R4.4 stored one mutually exclusive `view_mode` for the stage;
   map it onto the two stage panels so an upgrading user keeps what they had. */
const LEGACY_STAGE_PANELS: Record<ViewMode, { visualizer: boolean; code: boolean }> = {
  split: { visualizer: true, code: true },
  visual: { visualizer: true, code: false },
  code: { visualizer: false, code: true },
};

function readPanelVisibility(): PanelVisibility {
  const legacyViewMode = readStored<ViewMode | null>("view_mode", null, isLegacyViewMode);
  const legacyStage = legacyViewMode === null ? null : LEGACY_STAGE_PANELS[legacyViewMode];
  // Tutorial and auxiliary were already independent flags, so they migrate 1:1.
  return {
    visualizer: readStored(
      PANEL_STORAGE_KEYS.visualizer,
      legacyStage?.visualizer ?? true,
      isBoolean,
    ),
    code: readStored(PANEL_STORAGE_KEYS.code, legacyStage?.code ?? true, isBoolean),
    tutorial: readStored(
      PANEL_STORAGE_KEYS.tutorial,
      readStored("show_tutorial", true, isBoolean),
      isBoolean,
    ),
    auxiliary: readStored(
      PANEL_STORAGE_KEYS.auxiliary,
      readStored("show_auxiliary", true, isBoolean),
      isBoolean,
    ),
  };
}

export interface SettingsContextValue {
  panels: PanelVisibility;
  lastAlgorithmId: string;
  /** Playback speed (ms delay per step), shared across every algorithm's
      workspace — a media-player-style preference the user sets once. */
  speed: number;
  setPanel: (key: PanelKey, visible: boolean) => void;
  togglePanel: (key: PanelKey) => void;
  setLastAlgorithmId: (id: string) => void;
  setSpeed: (speed: number) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panels, setPanelsState] = useState<PanelVisibility>(readPanelVisibility);
  const [lastAlgorithmId, setLastAlgorithmIdState] = useState<string>(() =>
    readStored("last_algorithm_id", "bubble-sort", isString),
  );
  const [speed, setSpeedState] = useState<number>(() =>
    readStored("playback_speed", DEFAULT_PLAYBACK_SPEED_MS, isPlaybackSpeed),
  );

  const setPanel = useCallback((key: PanelKey, visible: boolean) => {
    setPanelsState((prev) => {
      if (prev[key] === visible) return prev;
      writeStored(PANEL_STORAGE_KEYS[key], visible);
      return { ...prev, [key]: visible };
    });
  }, []);

  const togglePanel = useCallback((key: PanelKey) => {
    setPanelsState((prev) => {
      const nextVis = !prev[key];
      writeStored(PANEL_STORAGE_KEYS[key], nextVis);
      return { ...prev, [key]: nextVis };
    });
  }, []);

  const setLastAlgorithmId = useCallback((id: string) => {
    setLastAlgorithmIdState(id);
    writeStored("last_algorithm_id", id);
  }, []);

  const setSpeed = useCallback((next: number) => {
    setSpeedState(next);
    writeStored("playback_speed", next);
  }, []);

  const value = useMemo(
    () => ({
      panels,
      lastAlgorithmId,
      speed,
      setPanel,
      togglePanel,
      setLastAlgorithmId,
      setSpeed,
    }),
    [panels, lastAlgorithmId, speed, setPanel, togglePanel, setLastAlgorithmId, setSpeed],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (ctx) return ctx;
  throw new Error("useSettings must be used within a SettingsProvider");
}
