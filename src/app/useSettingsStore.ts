import { create } from "zustand";
import type { PanelKey, PanelVisibility } from "../types/dsa";
import { LEARNING_ITEM_REGISTRY } from "../learning/registry";

const STORAGE_PREFIX = "dsa_visualizer_";

const PANEL_STORAGE_KEYS: Record<PanelKey, string> = {
  problem: "panel_problem",
  solution: "panel_solution",
  visualizer: "panel_visualizer",
  code: "panel_code",
  tutorial: "panel_tutorial",
  auxiliary: "panel_auxiliary",
  complexity: "panel_complexity",
  examples: "panel_examples",
};

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
    // Persistence is best-effort
  }
}

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isLearningItemId = (value: unknown): value is string =>
  typeof value === "string" && Object.hasOwn(LEARNING_ITEM_REGISTRY, value);

const LAST_ITEM_STORAGE_KEY = "last_item_id_v2";
const DEFAULT_ITEM_ID = "bubble-sort";

export const MIN_PLAYBACK_SPEED_MS = 50;
export const MAX_PLAYBACK_SPEED_MS = 1000;
export const DEFAULT_PLAYBACK_SPEED_MS = 300;

const isPlaybackSpeed = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= MIN_PLAYBACK_SPEED_MS &&
  value <= MAX_PLAYBACK_SPEED_MS;

export function readPanelVisibility(): PanelVisibility {
  return {
    problem: readStored(PANEL_STORAGE_KEYS.problem, true, isBoolean),
    solution: readStored(PANEL_STORAGE_KEYS.solution, true, isBoolean),
    visualizer: readStored(PANEL_STORAGE_KEYS.visualizer, true, isBoolean),
    code: readStored(PANEL_STORAGE_KEYS.code, true, isBoolean),
    tutorial: readStored(PANEL_STORAGE_KEYS.tutorial, true, isBoolean),
    auxiliary: readStored(PANEL_STORAGE_KEYS.auxiliary, true, isBoolean),
    complexity: readStored(PANEL_STORAGE_KEYS.complexity, true, isBoolean),
    examples: readStored(PANEL_STORAGE_KEYS.examples, true, isBoolean),
  };
}

export interface SettingsState {
  panels: PanelVisibility;
  lastItemId: string;
  speed: number;
  setPanel: (key: PanelKey, visible: boolean) => void;
  togglePanel: (key: PanelKey) => void;
  setLastItemId: (id: string) => void;
  setSpeed: (speed: number) => void;
  refreshFromStorage: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  panels: readPanelVisibility(),
  lastItemId: readStored(LAST_ITEM_STORAGE_KEY, DEFAULT_ITEM_ID, isLearningItemId),
  speed: readStored("playback_speed", DEFAULT_PLAYBACK_SPEED_MS, isPlaybackSpeed),

  setPanel: (key: PanelKey, visible: boolean) => {
    set((state) => {
      if (state.panels[key] === visible) return state;
      writeStored(PANEL_STORAGE_KEYS[key], visible);
      return { panels: { ...state.panels, [key]: visible } };
    });
  },

  togglePanel: (key: PanelKey) => {
    set((state) => {
      const nextVis = !state.panels[key];
      writeStored(PANEL_STORAGE_KEYS[key], nextVis);
      return { panels: { ...state.panels, [key]: nextVis } };
    });
  },

  setLastItemId: (id: string) => {
    const validId = isLearningItemId(id) ? id : DEFAULT_ITEM_ID;
    writeStored(LAST_ITEM_STORAGE_KEY, validId);
    set({ lastItemId: validId });
  },

  setSpeed: (speed: number) => {
    const validSpeed = isPlaybackSpeed(speed) ? speed : DEFAULT_PLAYBACK_SPEED_MS;
    writeStored("playback_speed", validSpeed);
    set({ speed: validSpeed });
  },

  refreshFromStorage: () => {
    set({
      panels: readPanelVisibility(),
      lastItemId: readStored(LAST_ITEM_STORAGE_KEY, DEFAULT_ITEM_ID, isLearningItemId),
      speed: readStored("playback_speed", DEFAULT_PLAYBACK_SPEED_MS, isPlaybackSpeed),
    });
  },
}));
