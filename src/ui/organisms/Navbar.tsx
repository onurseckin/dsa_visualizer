import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Brain,
  Code2,
  Eye,
  FileText,
  Lightbulb,
  LayoutPanelLeft,
  BookOpen,
  Layers,
  List,
  Network,
  RotateCcw,
  Activity,
} from "lucide-react";
import { CategoryType, AppView, PanelKey, PanelVisibility } from "../../types/dsa";
import { Button, ButtonGroup, ConfirmDialog, Segmented } from "../index";
import { resetWorkspaceLayout } from "../../app/workspaceLayout";
import { resetTriviaLayout } from "../../trivia/triviaLayout";
import { resetSqliteLayouts } from "../../app/sqliteSync";
import { isDialogOpen, isTypingTarget } from "../../app/keyboardGuards";
import { useSearchStore } from "../../app/useSearchStore";
import { SearchTrigger } from "../molecules/SearchTrigger";
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
    key: "problem",
    label: "Problem",
    icon: <FileText className="w-3.5 h-3.5" />,
    hint: "problem panel",
  },
  {
    key: "solution",
    label: "Solution",
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    hint: "solution panel",
  },
  {
    key: "visualizer",
    label: "Visualizer",
    icon: <Eye className="w-3.5 h-3.5" />,
    hint: "visualizer panel",
  },
  { key: "code", label: "Code", icon: <Code2 className="w-3.5 h-3.5" />, hint: "code panel" },
  {
    key: "complexity",
    label: "Complexity",
    icon: <Activity className="w-3.5 h-3.5" />,
    hint: "complexity panel",
  },
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
    resetTriviaLayout();
    void resetSqliteLayouts();
    setIsResetDialogOpen(false);
  };

  return (
    <header className="h-18 px-8 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] flex items-center justify-between gap-6 shrink-0">
      <nav aria-label="Main Navigation" className="flex items-center gap-6 min-w-0">
        <Button
          variant="secondary"
          size="sm"
          aria-label="DSA Visualizer home"
          onClick={() => onSetAppView("tree")}
          className="flex items-center gap-3 p-2 hover:bg-[var(--bg-hover)] min-h-[44px] rounded-xl transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)] shadow-sm">
            <Network className="w-4 h-4" />
          </div>
        </Button>

        <Segmented
          aria-label="App view"
          options={APP_VIEW_OPTIONS}
          value={appView}
          onChange={(val) => onSetAppView(val as AppView)}
          className="rounded-xl [&_.ui-segmented__btn]:px-4 [&_.ui-segmented__btn]:py-2.5 [&_.ui-segmented__btn]:min-h-[44px] [&_.ui-segmented__btn]:text-sm [&_.ui-segmented__btn]:font-medium [&_.ui-segmented__btn]:rounded-xl [&_.ui-segmented__btn]:text-[var(--text-secondary)] hover:[&_.ui-segmented__btn]:text-[var(--text-primary)] [&_.ui-segmented__btn]:transition-all [&_.ui-segmented__btn[aria-pressed=true]]:bg-[var(--bg-elevated)] [&_.ui-segmented__btn[aria-pressed=true]]:text-[var(--text-primary)] [&_.ui-segmented__btn[aria-pressed=true]]:border [&_.ui-segmented__btn[aria-pressed=true]]:border-[var(--border-default)] [&_.ui-segmented__btn[aria-pressed=true]]:shadow-sm"
        />
      </nav>

      <div className="flex items-center gap-4">
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
                className="p-2.5 min-h-[44px] min-w-[44px] rounded-xl"
              >
                {label}
              </Button>
            ))}
        </ButtonGroup>

        {(appView === "workspace" || appView === "trivia") && (
          <>
            <span aria-hidden="true" className="w-px h-4 bg-[var(--border-subtle)] shrink-0" />
            <Button
              size="sm"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              aria-label="Reset layout"
              onClick={() => setIsResetDialogOpen(true)}
              title="Restore the default panel sizes and details state"
              className="min-h-[44px] rounded-xl"
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
