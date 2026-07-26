import React, { createContext, useContext, useLayoutEffect } from "react";
import {
  DEFAULT_PLAYBACK_SPEED_MS,
  MAX_PLAYBACK_SPEED_MS,
  MIN_PLAYBACK_SPEED_MS,
  SettingsState,
  useSettingsStore,
} from "./useSettingsStore";

export { DEFAULT_PLAYBACK_SPEED_MS, MAX_PLAYBACK_SPEED_MS, MIN_PLAYBACK_SPEED_MS };
export type { SettingsState as SettingsContextValue };

const SettingsContext = createContext<SettingsState | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useSettingsStore();

  useLayoutEffect(() => {
    useSettingsStore.getState().refreshFromStorage();
  }, []);

  return <SettingsContext.Provider value={store}>{children}</SettingsContext.Provider>;
};

export function useSettings(): SettingsState {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
