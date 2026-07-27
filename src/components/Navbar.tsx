import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Brain,
  Code2,
  Eye,
  LayoutPanelLeft,
  BookOpen,
  Layers,
  List,
  Network,
  RotateCcw,
} from "lucide-react";
import { CategoryType, AppView, PanelKey, PanelVisibility } from "../types/dsa";
import { Button, ButtonGroup, ConfirmDialog, IconButton, Segmented } from "../ui";
import { resetWorkspaceLayout } from "../app/workspaceLayout";
import { isDialogOpen, isTypingTarget } from "../app/keyboardGuards";
import { useSearchStore } from "../app/useSearchStore";
import { SearchTrigger } from "./SearchTrigger";
import { QuickAccessDrawer } from "./QuickAccessDrawer";

export interface NavbarProps {
  appView: AppView;
  onSetAppView: (view: AppView) => void;
  categories?: { id: CategoryType; label: string }[];
  activeAlgorithmId?: string;
  onGlobalSelectAlgorithm: (id: string, categoryFolder?: CategoryType) => void;
  panels: PanelVisibility;
  onTogglePanel: (key: PanelKey) => void;
}

const APP_VIEW_OPTIONS = [
  { value: "tree", label: "Knowledge Tree", icon: <Network className="w-4 h-4" /> },
  { value: "list", label: "Problem List", icon: <List className="w-4 h-4" /> },
  { value: "workspace", label: "Workspace", icon: <LayoutPanelLeft className="w-4 h-4" /> },
  { value: "trivia", label: "Trivia", icon: <Brain className="w-4 h-4" /> },
];

const PANEL_TOGGLES: { key: PanelKey; label: string; icon: ReactNode; hint: string }[] = [
  {
    key: "visualizer",
    label: "Visualizer",
    icon: <Eye className="w-3.5 h-3.5" />,
    hint: "visualizer panel",
  },
  { key: "code", label: "Code", icon: <Code2 className="w-3.5 h-3.5" />, hint: "code panel" },
  {
    key: "tutorial",
    label: "Tutorial",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    hint: "tutorial panel",
  },
  {
    key: "auxiliary",
    label: "Aux data",
    icon: <Layers className="w-3.5 h-3.5" />,
    hint: "working data panel",
  },
];

export const Navbar: React.FC<NavbarProps> = ({
  appView,
  onSetAppView,
  categories,
  activeAlgorithmId,
  onGlobalSelectAlgorithm,
  panels,
  onTogglePanel,
}) => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useSearchStore();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdK = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey);
      const isSlash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (!isCmdK && !isSlash) return;
      if (isTypingTarget(e.target)) return;
      if (isDialogOpen()) return;
      e.preventDefault();
      openDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openDrawer]);

  const handleConfirmReset = () => {
    resetWorkspaceLayout();
    setIsResetDialogOpen(false);
  };

  return (
    <header className="flex items-center justify-between py-3 shrink-0 px-6 gap-6 bg-[var(--bg-chrome)] border-b border-[var(--border-default)]">
      <nav aria-label="Main Navigation" className="flex items-center gap-6 min-w-0">
        <IconButton
          icon={<Network className="w-[18px] h-[18px]" />}
          aria-label="DSA Visualizer home"
          title="Go to Knowledge Tree"
          onClick={() => onSetAppView("tree")}
          size="md"
          className="rounded-[var(--radius-md)] border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        />

        <Segmented
          aria-label="App view"
          size="md"
          options={APP_VIEW_OPTIONS}
          value={appView}
          onChange={(value) => onSetAppView(value as AppView)}
        />
      </nav>

      <div className="flex items-center gap-6">
        <ButtonGroup role="group" aria-label="Panel toggles" gap="sm">
          {appView === "workspace" &&
            PANEL_TOGGLES.map(({ key, label, icon, hint }) => (
              <Button
                key={key}
                size="sm"
                selected={panels[key]}
                aria-pressed={panels[key]}
                icon={icon}
                onClick={() => onTogglePanel(key)}
                title={`${panels[key] ? "Hide" : "Show"} the ${hint}`}
              >
                {label}
              </Button>
            ))}
        </ButtonGroup>

        {appView === "workspace" && (
          <>
            <span aria-hidden="true" className="w-px h-4 bg-[var(--border-subtle)] shrink-0" />
            <Button
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              aria-label="Reset layout"
              onClick={() => setIsResetDialogOpen(true)}
              title="Restore the default panel sizes and details state"
            >
              Reset layout
            </Button>
          </>
        )}

        <SearchTrigger onOpenDrawer={openDrawer} />
      </div>

      <QuickAccessDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onSelectAlgorithm={onGlobalSelectAlgorithm}
        activeAlgorithmId={activeAlgorithmId}
        categories={categories}
      />

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Reset workspace layout?"
        message="Your custom panel sizes and whether the details panel is expanded will be lost — every panel goes back to sizing itself. This cannot be undone."
        confirmLabel="Reset to defaults"
        cancelLabel="Keep my layout"
        destructive
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </header>
  );
};
