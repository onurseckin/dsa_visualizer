import React, { useEffect, useState } from 'react';
import {
  Code2,
  Eye,
  Columns,
  Volume2,
  VolumeX,
  BookOpen,
  Layers,
  Sparkles,
  Network,
  List,
} from 'lucide-react';
import { ViewMode, CategoryType, AppView } from '../types/dsa';
import { Button, IconButton, Segmented } from '../ui';
import { SearchTrigger } from './SearchTrigger';
import { QuickAccessDrawer } from './QuickAccessDrawer';

export interface NavbarProps {
  appView: AppView;
  onSetAppView: (view: AppView) => void;
  categories?: { id: CategoryType; label: string }[];
  activeCategory?: CategoryType;
  onSelectCategory?: (cat: CategoryType) => void;
  algorithmIds?: { id: string; title: string; difficulty?: string }[];
  activeAlgorithmId?: string;
  onSelectAlgorithm?: (id: string) => void;
  onGlobalSelectAlgorithm: (id: string, categoryFolder?: CategoryType) => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  showTutorial: boolean;
  onToggleTutorial: () => void;
  showAuxiliary: boolean;
  onToggleAuxiliary: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

/* Icon sizing comes from ui.css (14/16/18 per control size) — no inline sizes. */
const APP_VIEW_OPTIONS = [
  { value: 'tree', label: 'Knowledge Tree', icon: <Network /> },
  { value: 'list', label: 'Problem List', icon: <List /> },
  { value: 'workspace', label: 'Workspace', icon: <Code2 /> },
];

const VIEW_MODE_OPTIONS = [
  { value: 'split', label: 'Split', icon: <Columns /> },
  { value: 'visual', label: 'Visual', icon: <Eye /> },
  { value: 'code', label: 'Code', icon: <Code2 /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  appView,
  onSetAppView,
  categories,
  activeAlgorithmId,
  onGlobalSelectAlgorithm,
  viewMode,
  onSetViewMode,
  showTutorial,
  onToggleTutorial,
  showAuxiliary,
  onToggleAuxiliary,
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
        // Navy chrome tier: keeps the navbar visibly separate from the page and
        // from the emerald content cards below it.
        background: 'var(--bg-chrome)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Brand + app-view switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
        <button
          type="button"
          onClick={() => onSetAppView('tree')}
          aria-label="DSA Visualizer home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'transparent',
            border: 'none',
            padding: 'var(--space-1)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles style={{ width: '18px', height: '18px', color: 'var(--accent)' }} aria-hidden="true" />
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontWeight: 700,
              fontSize: 'var(--text-lg)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            DSA<span style={{ color: 'var(--accent)' }}>.Visualizer</span>
          </span>
        </button>

        <Segmented
          aria-label="App view"
          options={APP_VIEW_OPTIONS}
          value={appView}
          onChange={(value) => onSetAppView(value as AppView)}
        />
      </div>

      {/* Workspace controls + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {appView === 'workspace' && (
          <Segmented
            aria-label="View mode"
            size="sm"
            options={VIEW_MODE_OPTIONS}
            value={viewMode}
            onChange={(value) => onSetViewMode(value as ViewMode)}
          />
        )}

        <Button
          size="sm"
          selected={showTutorial}
          icon={<BookOpen />}
          onClick={onToggleTutorial}
          title="Toggle tutorial panel"
        >
          Tutorial
        </Button>

        <Button
          size="sm"
          selected={showAuxiliary}
          icon={<Layers />}
          onClick={onToggleAuxiliary}
          title="Toggle auxiliary data panels"
        >
          Aux Data
        </Button>

        <IconButton
          size="sm"
          selected={soundEnabled}
          icon={soundEnabled ? <Volume2 /> : <VolumeX />}
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
        />

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
