import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Brain,
  Code2,
  Eye,
  LayoutPanelLeft,
  BookOpen,
  Layers,
  Sparkles,
  Network,
  List,
  RotateCcw,
} from 'lucide-react';
import { CategoryType, AppView, PanelKey, PanelVisibility } from '../types/dsa';
import { Button, ConfirmDialog, Segmented } from '../ui';
import { resetWorkspaceLayout } from '../app/workspaceLayout';
import { isDialogOpen, isTypingTarget } from '../app/keyboardGuards';
import { SearchTrigger } from './SearchTrigger';
import { QuickAccessDrawer } from './QuickAccessDrawer';

export interface NavbarProps {
  appView: AppView;
  onSetAppView: (view: AppView) => void;
  categories?: { id: CategoryType; label: string }[];
  activeAlgorithmId?: string;
  onGlobalSelectAlgorithm: (id: string, categoryFolder?: CategoryType) => void;
  panels: PanelVisibility;
  onTogglePanel: (key: PanelKey) => void;
}

/* Icon sizing comes from ui.css (14/16/18 per control size) — no inline sizes. */
const APP_VIEW_OPTIONS = [
  { value: 'tree', label: 'Knowledge Tree', icon: <Network /> },
  { value: 'list', label: 'Problem List', icon: <List /> },
  { value: 'workspace', label: 'Workspace', icon: <LayoutPanelLeft /> },
  { value: 'trivia', label: 'Trivia', icon: <Brain /> },
];

/* One visual treatment for every toggle (DESIGN.md R4.4): each shows or hides
   exactly one thing, so none of them is a mode switch. */
const PANEL_TOGGLES: { key: PanelKey; label: string; icon: ReactNode; hint: string }[] = [
  { key: 'visualizer', label: 'Visualizer', icon: <Eye />, hint: 'visualizer panel' },
  { key: 'code', label: 'Code', icon: <Code2 />, hint: 'code panel' },
  { key: 'tutorial', label: 'Tutorial', icon: <BookOpen />, hint: 'tutorial panel' },
  { key: 'auxiliary', label: 'Aux data', icon: <Layers />, hint: 'working data panel' },
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Global "/" shortcut: open the search drawer unless the user is typing somewhere.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (isDialogOpen()) return;
      e.preventDefault();
      setIsDrawerOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* The only path allowed to drop the persisted geometry. resetWorkspaceLayout
     owns both halves — clearing storage AND announcing it — so the workspace
     re-reads defaults live instead of waiting for a reload, and the clear and the
     announcement cannot drift apart here (DESIGN.md R6.5). */
  const handleConfirmReset = () => {
    resetWorkspaceLayout();
    setIsResetDialogOpen(false);
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 'var(--navbar-h)',
        flexShrink: 0,
        padding: '0 var(--space-4)',
        gap: 'var(--space-3)',
        // Chrome tier: the toolbar strip the page sits under. Chrome and page are
        // only ~1.8x apart, so the bottom border is what draws the seam.
        background: 'var(--bg-chrome)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Brand + app-view switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
        {/* The wordmark is text, not a selection, so it stays on the neutral text
            ramp — the accent is reserved for interaction state (R5.1). */}
        <Button
          variant="ghost"
          size="sm"
          icon={<Sparkles />}
          aria-label="DSA Visualizer home"
          onClick={() => onSetAppView('tree')}
        >
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontWeight: 700,
              fontSize: 'var(--text-lg)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            DSA<span style={{ color: 'var(--text-secondary)' }}>.Visualizer</span>
          </span>
        </Button>

        {/* Mutually exclusive routing stays a Segmented — it is not a toggle set. */}
        <Segmented
          aria-label="App view"
          size="sm"
          options={APP_VIEW_OPTIONS}
          value={appView}
          onChange={(value) => onSetAppView(value as AppView)}
        />
      </div>

      {/* Toggles + search — every control in this row is size sm (DESIGN.md R4.5). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div
          role="group"
          aria-label="Panel toggles"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          {appView === 'workspace' &&
            PANEL_TOGGLES.map(({ key, label, icon, hint }) => (
              <Button
                key={key}
                size="sm"
                selected={panels[key]}
                aria-pressed={panels[key]}
                icon={icon}
                onClick={() => onTogglePanel(key)}
                title={`${panels[key] ? 'Hide' : 'Show'} the ${hint}`}
              >
                {label}
              </Button>
            ))}
        </div>

        {/* Reset is an action, not a toggle, so it sits outside the toggle group
            with a hairline between them — same sm scale and border, no
            aria-pressed (DESIGN.md R6.5). */}
        {appView === 'workspace' && (
          <>
            <span
              aria-hidden="true"
              style={{
                width: '1px',
                height: 'var(--space-4)',
                background: 'var(--border-subtle)',
                flexShrink: 0,
              }}
            />
            <Button
              size="sm"
              icon={<RotateCcw />}
              aria-label="Reset layout"
              onClick={() => setIsResetDialogOpen(true)}
              title="Restore the default panel sizes and details state"
            >
              Reset layout
            </Button>
          </>
        )}

        <SearchTrigger onOpenDrawer={() => setIsDrawerOpen(true)} />
      </div>

      <QuickAccessDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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
