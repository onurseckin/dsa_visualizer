import { beforeEach, describe, expect, it } from "vitest";
import { useSearchStore } from "../useSearchStore";
import { useSettingsStore } from "../useSettingsStore";
import { useWorkspaceLayoutStore } from "../useWorkspaceLayoutStore";
import { useTriviaStore } from "../../trivia/useTriviaStore";

describe("Zustand stores suite", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().refreshFromStorage();
    useSearchStore.setState({ isDrawerOpen: false });
    useWorkspaceLayoutStore.getState().resetLayout();
    useTriviaStore.getState().refreshFromStorage();
  });

  describe("useSettingsStore", () => {
    it("manages panel visibility, playback speed, and last algorithm id", () => {
      const store = useSettingsStore.getState();
      expect(store.panels.visualizer).toBe(true);

      store.togglePanel("visualizer");
      expect(useSettingsStore.getState().panels.visualizer).toBe(false);

      store.setPanel("visualizer", true);
      expect(useSettingsStore.getState().panels.visualizer).toBe(true);

      store.setLastAlgorithmId("quick-sort");
      expect(useSettingsStore.getState().lastAlgorithmId).toBe("quick-sort");

      store.setSpeed(500);
      expect(useSettingsStore.getState().speed).toBe(500);
    });
  });

  describe("useSearchStore", () => {
    it("toggles and sets drawer open state", () => {
      expect(useSearchStore.getState().isDrawerOpen).toBe(false);

      useSearchStore.getState().openDrawer();
      expect(useSearchStore.getState().isDrawerOpen).toBe(true);

      useSearchStore.getState().closeDrawer();
      expect(useSearchStore.getState().isDrawerOpen).toBe(false);

      useSearchStore.getState().toggleDrawer();
      expect(useSearchStore.getState().isDrawerOpen).toBe(true);
    });
  });

  describe("useWorkspaceLayoutStore", () => {
    it("patches, resets, and manages workspace layout", () => {
      useWorkspaceLayoutStore.getState().resetLayout();
      expect(useWorkspaceLayoutStore.getState().layout.splitPercent).toBe(60);

      useWorkspaceLayoutStore.getState().patchLayout({ splitPercent: 70 });
      expect(useWorkspaceLayoutStore.getState().layout.splitPercent).toBe(70);

      useWorkspaceLayoutStore.getState().resetLayout();
      expect(useWorkspaceLayoutStore.getState().layout.splitPercent).toBe(60);
    });
  });

  describe("useTriviaStore", () => {
    it("manages trivia session records and active session", () => {
      const store = useTriviaStore.getState();
      const newSession = store.createSession("Test Session");
      expect(newSession.name).toBe("Test Session");

      store.renameSession(newSession.id, "Renamed Session");
      expect(useTriviaStore.getState().sessions.find((s) => s.id === newSession.id)?.name).toBe(
        "Renamed Session",
      );

      store.deleteSession(newSession.id);
      expect(
        useTriviaStore.getState().sessions.find((s) => s.id === newSession.id),
      ).toBeUndefined();
    });
  });
});
