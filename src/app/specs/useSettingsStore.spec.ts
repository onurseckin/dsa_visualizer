import { beforeEach, describe, expect, it } from "vitest";
import { useSearchStore } from "../useSearchStore";
import { useSettingsStore } from "../useSettingsStore";
import { useWorkspaceLayoutStore } from "../useWorkspaceLayoutStore";

describe("Zustand stores suite", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().refreshFromStorage();
    useSearchStore.setState({ isDrawerOpen: false });
    useWorkspaceLayoutStore.getState().resetLayout();
  });

  describe("useSettingsStore", () => {
    it("manages panel visibility, playback speed, and last learning item id", () => {
      const store = useSettingsStore.getState();
      expect(store.panels.visualizer).toBe(true);

      store.togglePanel("visualizer");
      expect(useSettingsStore.getState().panels.visualizer).toBe(false);

      store.setPanel("visualizer", true);
      expect(useSettingsStore.getState().panels.visualizer).toBe(true);

      store.setLastItemId("quick-sort");
      expect(useSettingsStore.getState().lastItemId).toBe("quick-sort");

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
});
