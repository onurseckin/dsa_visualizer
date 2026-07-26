import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  WORKSPACE_LAYOUT_KEY,
  WORKSPACE_LAYOUT_RESET_EVENT,
  WorkspaceLayout,
  readWorkspaceLayout,
  resetWorkspaceLayout,
  writeWorkspaceLayout,
} from "../workspaceLayout";

const customLayout: WorkspaceLayout = {
  version: 8,
  splitPercent: 42,
  panelHeights: {
    stage: null,
    visualizer: null,
    tutorial: null,
    auxiliary: null,
    code: 180,
    complexity: 240,
    problem: null,
    solution: null,
  },
  problemExpanded: false,
  solutionExpanded: false,
};

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("reset announced to the workspace", () => {
  it("clears storage and announces the reset on one named window event", () => {
    writeWorkspaceLayout(customLayout);
    const heard: string[] = [];
    const listener = () => heard.push("reset");
    window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);

    const result = resetWorkspaceLayout();

    window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);
    expect(WORKSPACE_LAYOUT_RESET_EVENT).toBe("dsa:workspace-layout-reset");
    expect(heard).toEqual(["reset"]);
    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).toBeNull();
    expect(result).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(readWorkspaceLayout()).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("announces nothing when it was never called, so no listener resets by accident", () => {
    writeWorkspaceLayout(customLayout);
    const heard: string[] = [];
    const listener = () => heard.push("reset");
    window.addEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);

    writeWorkspaceLayout({ splitPercent: 50 });

    window.removeEventListener(WORKSPACE_LAYOUT_RESET_EVENT, listener);
    expect(heard).toEqual([]);
    expect(localStorage.getItem(WORKSPACE_LAYOUT_KEY)).not.toBeNull();
  });
});
