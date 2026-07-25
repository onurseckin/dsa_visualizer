import React, { useState } from 'react';
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
import { GlobalSearchBar } from './GlobalSearchBar';
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

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      {/* Brand & App View Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <div
          onClick={() => onSetAppView('tree')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <Sparkles style={{ color: 'var(--accent-emerald)', width: '22px', height: '22px' }} />
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
            }}
          >
            DSA<span style={{ color: 'var(--accent-emerald)' }}>.Visualizer</span>
          </span>
        </div>

        {/* View Switcher: Knowledge Tree vs Problem List vs Workspace */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-darkest)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-muted)',
          }}
        >
          <button
            className={`btn ${appView === 'tree' ? 'btn-active' : ''}`}
            onClick={() => onSetAppView('tree')}
            title="Knowledge Graph Tree Map"
            style={{ padding: '0.35rem 0.75rem', border: 'none' }}
          >
            <Network style={{ width: '15px', height: '15px' }} />
            <span style={{ fontSize: '0.8rem' }}>Knowledge Tree</span>
          </button>
          <button
            className={`btn ${appView === 'list' ? 'btn-active' : ''}`}
            onClick={() => onSetAppView('list')}
            title="All Problems & Algorithms Directory"
            style={{ padding: '0.35rem 0.75rem', border: 'none' }}
          >
            <List style={{ width: '15px', height: '15px' }} />
            <span style={{ fontSize: '0.8rem' }}>Problem List</span>
          </button>
          <button
            className={`btn ${appView === 'workspace' ? 'btn-active' : ''}`}
            onClick={() => onSetAppView('workspace')}
            title="Algorithm Visualizer Workspace"
            style={{ padding: '0.35rem 0.75rem', border: 'none' }}
          >
            <Code2 style={{ width: '15px', height: '15px' }} />
            <span style={{ fontSize: '0.8rem' }}>Visualizer Workspace</span>
          </button>
        </div>
      </div>

      {/* View Mode & Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {appView === 'workspace' && (
          <div style={{ display: 'flex', background: 'var(--bg-darkest)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-muted)' }}>
            <button
              className={`btn ${viewMode === 'split' ? 'btn-active' : ''}`}
              onClick={() => onSetViewMode('split')}
              title="Split View"
              style={{ padding: '0.3rem 0.6rem', border: 'none' }}
            >
              <Columns style={{ width: '14px', height: '14px' }} />
              <span style={{ fontSize: '0.75rem' }}>Split</span>
            </button>
            <button
              className={`btn ${viewMode === 'visual' ? 'btn-active' : ''}`}
              onClick={() => onSetViewMode('visual')}
              title="Visuals Only"
              style={{ padding: '0.3rem 0.6rem', border: 'none' }}
            >
              <Eye style={{ width: '14px', height: '14px' }} />
              <span style={{ fontSize: '0.75rem' }}>Visual</span>
            </button>
            <button
              className={`btn ${viewMode === 'code' ? 'btn-active' : ''}`}
              onClick={() => onSetViewMode('code')}
              title="Code Only"
              style={{ padding: '0.3rem 0.6rem', border: 'none' }}
            >
              <Code2 style={{ width: '14px', height: '14px' }} />
              <span style={{ fontSize: '0.75rem' }}>Code</span>
            </button>
          </div>
        )}

        <button
          className={`btn ${showTutorial ? 'btn-active' : ''}`}
          onClick={onToggleTutorial}
          title="Toggle Tutorial Panel"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          <BookOpen style={{ width: '15px', height: '15px' }} />
          <span style={{ fontSize: '0.75rem' }}>Tutorial</span>
        </button>

        <button
          className={`btn ${showAuxiliary ? 'btn-active' : ''}`}
          onClick={onToggleAuxiliary}
          title="Toggle Auxiliary Side Panels"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          <Layers style={{ width: '15px', height: '15px' }} />
          <span style={{ fontSize: '0.75rem' }}>Aux Data</span>
        </button>

        <button
          className="btn"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          style={{ padding: '0.35rem 0.6rem' }}
        >
          {soundEnabled ? (
            <Volume2 style={{ width: '15px', height: '15px', color: 'var(--accent-emerald)' }} />
          ) : (
            <VolumeX style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
          )}
        </button>

        {/* Global Navbar Fast Search Bar & Problem Directory Trigger (Rightmost End) */}
        <GlobalSearchBar
          onSelectAlgorithm={onGlobalSelectAlgorithm}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      </div>

      {/* Quick Access Sliding Glass Side Drawer */}
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

