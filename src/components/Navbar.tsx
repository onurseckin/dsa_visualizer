import React from 'react';
import {
  Code2,
  Eye,
  Columns,
  Volume2,
  VolumeX,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ViewMode, CategoryType } from '../types/dsa';

interface NavbarProps {
  categories: { id: CategoryType; label: string }[];
  activeCategory: CategoryType;
  onSelectCategory: (cat: CategoryType) => void;
  algorithmIds: { id: string; title: string; difficulty?: string }[];
  activeAlgorithmId: string;
  onSelectAlgorithm: (id: string) => void;
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
  categories,
  activeCategory,
  onSelectCategory,
  algorithmIds,
  activeAlgorithmId,
  onSelectAlgorithm,
  viewMode,
  onSetViewMode,
  showTutorial,
  onToggleTutorial,
  showAuxiliary,
  onToggleAuxiliary,
  soundEnabled,
  onToggleSound,
}) => {
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
      {/* Brand & Category Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

        {/* Category Tabs */}
        <nav style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`btn ${activeCategory === cat.id ? 'btn-active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Algorithm Selector Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          Algorithm:
        </span>
        <select
          value={activeAlgorithmId}
          onChange={(e) => onSelectAlgorithm(e.target.value)}
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 0.8rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {algorithmIds.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} {item.difficulty ? `(${item.difficulty})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* View Mode & Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* View Mode Toggle Buttons */}
        <div style={{ display: 'flex', background: 'var(--bg-darkest)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-muted)' }}>
          <button
            className={`btn ${viewMode === 'split' ? 'btn-active' : ''}`}
            onClick={() => onSetViewMode('split')}
            title="Split View (Visuals + Code)"
            style={{ padding: '0.3rem 0.6rem', border: 'none' }}
          >
            <Columns style={{ width: '15px', height: '15px' }} />
            <span style={{ fontSize: '0.75rem' }}>Split</span>
          </button>
          <button
            className={`btn ${viewMode === 'visual' ? 'btn-active' : ''}`}
            onClick={() => onSetViewMode('visual')}
            title="Visuals Only"
            style={{ padding: '0.3rem 0.6rem', border: 'none' }}
          >
            <Eye style={{ width: '15px', height: '15px' }} />
            <span style={{ fontSize: '0.75rem' }}>Visual</span>
          </button>
          <button
            className={`btn ${viewMode === 'code' ? 'btn-active' : ''}`}
            onClick={() => onSetViewMode('code')}
            title="Code Only"
            style={{ padding: '0.3rem 0.6rem', border: 'none' }}
          >
            <Code2 style={{ width: '15px', height: '15px' }} />
            <span style={{ fontSize: '0.75rem' }}>Code</span>
          </button>
        </div>

        {/* Feature Toggles */}
        <button
          className={`btn ${showTutorial ? 'btn-active' : ''}`}
          onClick={onToggleTutorial}
          title="Toggle Tutorial Explanation Panel"
          style={{ padding: '0.35rem 0.6rem' }}
        >
          <BookOpen style={{ width: '15px', height: '15px' }} />
          <span style={{ fontSize: '0.75rem' }}>Tutorial</span>
        </button>

        <button
          className={`btn ${showAuxiliary ? 'btn-active' : ''}`}
          onClick={onToggleAuxiliary}
          title="Toggle Auxiliary Side Data Structures (Queue/Stack/HashMap)"
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
      </div>
    </header>
  );
};
