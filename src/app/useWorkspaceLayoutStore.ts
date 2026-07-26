import { create } from "zustand";
import {
  clearWorkspaceLayout,
  readWorkspaceLayout,
  resetWorkspaceLayout,
  writeWorkspaceLayout,
} from "./workspaceLayoutStorage";
import { WorkspaceLayout, WorkspaceLayoutPatch } from "./workspaceLayoutTypes";

export interface WorkspaceLayoutStoreState {
  layout: WorkspaceLayout;
  patchLayout: (patch: WorkspaceLayoutPatch) => void;
  resetLayout: () => WorkspaceLayout;
  clearLayout: () => void;
  refreshFromStorage: () => void;
}

export const useWorkspaceLayoutStore = create<WorkspaceLayoutStoreState>((set) => ({
  layout: readWorkspaceLayout(),

  patchLayout: (patch: WorkspaceLayoutPatch) => {
    const updated = writeWorkspaceLayout(patch);
    set({ layout: updated });
  },

  resetLayout: () => {
    const defaultLayout = resetWorkspaceLayout();
    set({ layout: defaultLayout });
    return defaultLayout;
  },

  clearLayout: () => {
    clearWorkspaceLayout();
    set({ layout: readWorkspaceLayout() });
  },

  refreshFromStorage: () => {
    set({ layout: readWorkspaceLayout() });
  },
}));
