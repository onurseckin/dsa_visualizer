import React, { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Brain,
  BrainCircuit,
  Check,
  ChevronDown,
  Code2,
  Eye,
  FileText,
  GraduationCap,
  Lightbulb,
  LayoutPanelLeft,
  BookOpen,
  Layers,
  List,
  ListChecks,
  Network,
  RotateCcw,
  Activity,
} from "lucide-react";
import { TopicId, AppView, PanelKey, PanelVisibility } from "../../types/dsa";
import { Button, ConfirmDialog, Segmented, cx } from "../index";
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
  topics?: readonly { id: TopicId; label: string }[];
  activeAlgorithmId?: string;
  onGlobalSelectAlgorithm: (id: string) => void;
  panels: PanelVisibility;
  onTogglePanel: (key: PanelKey) => void;
}

const APP_VIEW_OPTIONS = [
  { value: "ml-infra", label: "ML Infra", icon: <BrainCircuit className="w-4 h-4" /> },
  { value: "tree", label: "Knowledge Tree", icon: <Network className="w-4 h-4" /> },
  { value: "learn", label: "Learn", icon: <GraduationCap className="w-4 h-4" /> },
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
    key: "examples",
    label: "Examples",
    icon: <ListChecks className="w-3.5 h-3.5" />,
    hint: "examples panel",
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
  topics,
  activeAlgorithmId,
  onGlobalSelectAlgorithm,
  panels,
  onTogglePanel,
}) => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useSearchStore();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isVisibilityOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsVisibilityOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisibilityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisibilityOpen]);

  const handleConfirmReset = () => {
    if (appView === "workspace") {
      resetWorkspaceLayout(activeAlgorithmId);
    } else if (appView === "trivia") {
      resetTriviaLayout();
      void resetSqliteLayouts();
    }
    setIsResetDialogOpen(false);
  };

  return (
    <header className="h-18 px-8 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] flex items-center justify-between gap-6 shrink-0">
      <nav aria-label="Main Navigation" className="flex items-center gap-6 min-w-0">
        <Segmented
          aria-label="App view"
          options={APP_VIEW_OPTIONS}
          value={appView}
          onChange={(val) => onSetAppView(val as AppView)}
          className="rounded-xl [&_.ui-segmented__btn]:px-4 [&_.ui-segmented__btn]:py-2.5 [&_.ui-segmented__btn]:min-h-[44px] [&_.ui-segmented__btn]:text-sm [&_.ui-segmented__btn]:font-medium [&_.ui-segmented__btn]:rounded-xl [&_.ui-segmented__btn]:text-[var(--text-secondary)] hover:[&_.ui-segmented__btn]:text-[var(--text-primary)] [&_.ui-segmented__btn]:transition-all [&_.ui-segmented__btn[aria-pressed=true]]:bg-[var(--bg-elevated)] [&_.ui-segmented__btn[aria-pressed=true]]:text-[var(--text-primary)] [&_.ui-segmented__btn[aria-pressed=true]]:border [&_.ui-segmented__btn[aria-pressed=true]]:border-[var(--border-default)] [&_.ui-segmented__btn[aria-pressed=true]]:shadow-sm"
        />
      </nav>

      <div className="flex items-center gap-4">
        {appView === "workspace" && (
          <div className="relative" ref={dropdownRef}>
            <Button
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              selected={isVisibilityOpen}
              aria-expanded={isVisibilityOpen}
              aria-haspopup="menu"
              onClick={() => setIsVisibilityOpen((prev) => !prev)}
              title="Toggle section visibility"
              className="min-h-[44px] rounded-xl flex items-center gap-1.5"
            >
              <span>Visibility</span>
              <ChevronDown
                className={cx(
                  "w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-200",
                  isVisibilityOpen && "rotate-180",
                )}
              />
            </Button>

            {isVisibilityOpen && (
              <div
                role="menu"
                aria-label="Visibility section toggles"
                className="absolute right-0 top-full mt-2 w-52 py-1.5 px-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl shadow-xl z-[var(--z-dropdown)] flex flex-col gap-0.5"
              >
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Workspace Sections
                </div>
                {PANEL_TOGGLES.map(({ key, label, icon, hint }) => {
                  const isVisible = panels[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={isVisible}
                      onClick={() => onTogglePanel(key)}
                      title={`${isVisible ? "Hide" : "Show"} the ${hint}`}
                      className={cx(
                        "w-full px-2.5 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition-colors cursor-pointer select-none",
                        isVisible
                          ? "bg-[var(--bg-pressed)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[var(--text-muted)] shrink-0">{icon}</span>
                        <span className="truncate">{label}</span>
                      </div>
                      <div
                        className={cx(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ml-2",
                          isVisible
                            ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--text-on-accent)]"
                            : "border-[var(--border-strong)] bg-transparent",
                        )}
                      >
                        {isVisible && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
        topics={topics}
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
