import { beforeEach, describe, expect, it } from "vitest";
import { useWorkspaceLayoutStore } from "../useWorkspaceLayoutStore";
import { WORKSPACE_LAYOUT_KEY } from "../workspaceLayoutTypes";

describe("useWorkspaceLayoutStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceLayoutStore.getState().refreshFromStorage();
  });

  it("persists a clamped patch and can restore it from storage", () => {
    useWorkspaceLayoutStore.getState().patchLayout({
      splitPercent: 100,
      panelHeights: { stage: 20, code: 512 },
      problemExpanded: false,
    });

    expect(useWorkspaceLayoutStore.getState().layout).toMatchObject({
      splitPercent: 80,
      panelHeights: { stage: 64, code: 512 },
      problemExpanded: false,
    });
    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toContain('"splitPercent":80');

    useWorkspaceLayoutStore.setState({
      layout: { ...useWorkspaceLayoutStore.getState().layout, splitPercent: 25 },
    });
    useWorkspaceLayoutStore.getState().refreshFromStorage();
    expect(useWorkspaceLayoutStore.getState().layout.splitPercent).toBe(80);
  });

  it("clears and resets the in-memory layout to storage defaults", () => {
    useWorkspaceLayoutStore.getState().patchLayout({ splitPercent: 70 });
    useWorkspaceLayoutStore.getState().clearLayout();

    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
    expect(useWorkspaceLayoutStore.getState().layout.splitPercent).toBe(60);

    useWorkspaceLayoutStore.getState().patchLayout({ splitPercent: 72 });
    expect(useWorkspaceLayoutStore.getState().resetLayout().splitPercent).toBe(60);
    expect(useWorkspaceLayoutStore.getState().layout.splitPercent).toBe(60);
  });
});
