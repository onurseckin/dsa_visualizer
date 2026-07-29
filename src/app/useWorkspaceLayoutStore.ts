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
  patchLayout: (patch: WorkspaceLayoutPatch, algorithmId?: string) => void;
  resetLayout: (algorithmId?: string) => WorkspaceLayout;
  clearLayout: (algorithmId?: string) => void;
  refreshFromStorage: (algorithmId?: string) => void;
}

export const useWorkspaceLayoutStore = create<WorkspaceLayoutStoreState>((set) => ({
  layout: readWorkspaceLayout(),

  patchLayout: (patch: WorkspaceLayoutPatch, algorithmId?: string) => {
    const updated = writeWorkspaceLayout(patch, algorithmId);
    set({ layout: updated });
  },

  resetLayout: (algorithmId?: string) => {
    const defaultLayout = resetWorkspaceLayout(algorithmId);
    set({ layout: defaultLayout });
    return defaultLayout;
  },

  clearLayout: (algorithmId?: string) => {
    clearWorkspaceLayout(algorithmId);
    set({ layout: readWorkspaceLayout(algorithmId) });
  },

  refreshFromStorage: (algorithmId?: string) => {
    set({ layout: readWorkspaceLayout(algorithmId) });
  },
}));
