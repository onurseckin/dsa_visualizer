import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Code2,
  Eye,
  LayoutPanelLeft,
  Volume2,
  VolumeX,
  BookOpen,
  Layers,
  Sparkles,
  Network,
  List,
} from 'lucide-react';
import { CategoryType, AppView, PanelKey, PanelVisibility } from '../types/dsa';
import { Button, Segmented } from '../ui';
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
  soundEnabled: boolean;
  onToggleSound: () => void;
}

/* Icon sizing comes from ui.css (14/16/18 per control size) — no inline sizes. */
const APP_VIEW_OPTIONS = [
  { value: 'tree', label: 'Knowledge Tree', icon: <Network /> },
  { value: 'list', label: 'Problem List', icon: <List /> },
  { value: 'workspace', label: 'Workspace', icon: <LayoutPanelLeft /> },
];

/* Five independent toggles, one visual treatment (DESIGN.md R4.4): each shows or
   hides exactly one thing, so none of them is a mode switch. */
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
  soundEnabled,
  onToggleSound,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Global "/" shortcut: open the search drawer unless the user is typing somewhere.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }
      e.preventDefault();
      setIsDrawerOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          aria-label="Panel and sound toggles"
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

          <Button
            size="sm"
            selected={soundEnabled}
            aria-pressed={soundEnabled}
            icon={soundEnabled ? <Volume2 /> : <VolumeX />}
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute step sounds' : 'Play a sound on every step'}
          >
            Sound
          </Button>
        </div>

        <SearchTrigger onOpenDrawer={() => setIsDrawerOpen(true)} />
      </div>

      <QuickAccessDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectAlgorithm={onGlobalSelectAlgorithm}
        activeAlgorithmId={activeAlgorithmId}
        categories={categories}
      />
    </header>
  );
};
