import React, { useState, useEffect } from 'react';
import { StepExplanation } from '../../types/dsa';

export interface PedagogicalInsight {
  intuition?: string;
  invariant?: string;
  rationale?: string;
}

export type TutorialLayoutMode = 'horizontal' | 'vertical' | 'overlay';

export interface TutorialCardProps {
  explanation?: StepExplanation & Partial<PedagogicalInsight>;
  what?: string;
  why?: string;
  intuition?: string;
  invariant?: string;
  rationale?: string;
  stepIndex?: number;
  totalSteps?: number;
  codeLine?: number;
  initialCollapsed?: boolean;
  onClose?: () => void;
  variant?: 'standalone' | 'banner' | 'floating' | 'sidebar';
  layout?: TutorialLayoutMode;
  onLayoutChange?: (layout: TutorialLayoutMode) => void;
}

type TabType = 'all' | 'intuition' | 'invariant' | 'rationale';

export const TutorialCard: React.FC<TutorialCardProps> = ({
  explanation,
  what,
  why,
  intuition,
  invariant,
  rationale,
  stepIndex,
  totalSteps,
  codeLine,
  initialCollapsed = false,
  onClose,
  variant = 'standalone',
  layout: propLayout,
  onLayoutChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useEffect(() => {
    setIsCollapsed(initialCollapsed);
  }, [initialCollapsed]);

  const initialLayoutMode: TutorialLayoutMode =
    propLayout ||
    (variant === 'floating'
      ? 'overlay'
      : variant === 'sidebar'
        ? 'vertical'
        : 'horizontal');

  const [layoutMode, setLayoutMode] = useState<TutorialLayoutMode>(initialLayoutMode);

  const currentLayout = propLayout || layoutMode;

  const handleLayoutToggle = (mode: TutorialLayoutMode) => {
    setLayoutMode(mode);
    if (onLayoutChange) {
      onLayoutChange(mode);
    }
  };

  const whatText = what || explanation?.what || '';
  const whyText = why || explanation?.why || '';
  const intuitionText = intuition || explanation?.intuition || '';
  const invariantText =
    invariant ||
    explanation?.invariant ||
    (stepIndex !== undefined
      ? `Step ${stepIndex + 1} State Invariant: Data structures and pointers satisfy algorithm loop invariants.`
      : '');
  const rationaleText = rationale || explanation?.rationale || whyText || '';

  const isOverlay = currentLayout === 'overlay';
  const isVertical = currentLayout === 'vertical';
  const isBanner = variant === 'banner' && currentLayout === 'horizontal';

  const getContainerStyle = (): React.CSSProperties => {
    if (isOverlay) {
      return {
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 30,
        width: 'calc(100% - 24px)',
        maxWidth: '380px',
        maxHeight: isCollapsed ? 'auto' : 'calc(100% - 24px)',
        overflow: 'hidden',
        background: 'rgba(6, 18, 14, 0.94)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      };
    }

    if (isVertical) {
      return {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      };
    }

    return {
      width: '100%',
      overflow: 'hidden',
      background: isBanner ? 'transparent' : 'var(--bg-surface)',
      border: isBanner ? 'none' : '1px solid var(--border-subtle)',
      borderRadius: isBanner ? 0 : 'var(--radius-md)',
    };
  };

  return (
    <div className={isBanner ? 'tutorial-card-banner' : 'glass-card'} style={getContainerStyle()}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isCollapsed ? '8px 12px' : '10px 14px',
          background: 'var(--bg-surface)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              color: 'var(--bg-darkest)',
              fontSize: '0.8rem',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            💡
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
            Step Tutorial Guide
          </span>
          {stepIndex !== undefined && (
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-code)',
                color: 'var(--accent-mint)',
                background: 'rgba(0, 255, 157, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid var(--border-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              Step {stepIndex + 1}{totalSteps !== undefined ? ` / ${totalSteps}` : ''}
            </span>
          )}
          {codeLine !== undefined && (
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-code)',
                color: 'var(--accent-cyan)',
                whiteSpace: 'nowrap',
              }}
            >
              Line {codeLine}
            </span>
          )}
        </div>

        {/* Toolbar controls */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Layout Switcher Buttons */}
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px',
              border: '1px solid var(--border-muted)',
            }}
          >
            <button
              type="button"
              title="Horizontal Layout"
              aria-label="Horizontal Layout"
              onClick={() => handleLayoutToggle('horizontal')}
              style={{
                padding: '2px 6px',
                fontSize: '0.7rem',
                background: currentLayout === 'horizontal' ? 'var(--accent-emerald)' : 'transparent',
                color: currentLayout === 'horizontal' ? 'var(--bg-darkest)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: currentLayout === 'horizontal' ? 700 : 500,
              }}
            >
              Banner
            </button>
            <button
              type="button"
              title="Vertical Layout"
              aria-label="Vertical Layout"
              onClick={() => handleLayoutToggle('vertical')}
              style={{
                padding: '2px 6px',
                fontSize: '0.7rem',
                background: currentLayout === 'vertical' ? 'var(--accent-emerald)' : 'transparent',
                color: currentLayout === 'vertical' ? 'var(--bg-darkest)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: currentLayout === 'vertical' ? 700 : 500,
              }}
            >
              Side
            </button>
            <button
              type="button"
              title="Overlay Layout"
              aria-label="Overlay Layout"
              onClick={() => handleLayoutToggle('overlay')}
              style={{
                padding: '2px 6px',
                fontSize: '0.7rem',
                background: currentLayout === 'overlay' ? 'var(--accent-emerald)' : 'transparent',
                color: currentLayout === 'overlay' ? 'var(--bg-darkest)' : 'var(--text-dim)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: currentLayout === 'overlay' ? 700 : 500,
              }}
            >
              Float
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn"
            style={{
              padding: '2px 8px',
              fontSize: '0.75rem',
              lineHeight: 1,
              background: 'transparent',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-main)',
            }}
          >
            {isCollapsed ? 'Show ▲' : 'Collapse ▼'}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn"
              title="Close tutorial"
              aria-label="Close tutorial"
              style={{
                padding: '2px 8px',
                fontSize: '0.75rem',
                lineHeight: 1,
                background: 'transparent',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      {!isCollapsed && (
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            maxHeight: isOverlay ? '360px' : isVertical ? '100%' : 'none',
          }}
        >
          {/* Pedagogical Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-muted)', paddingBottom: '6px' }}>
            {(['all', 'intuition', 'invariant', 'rationale'] as TabType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(0, 255, 157, 0.15)' : 'transparent',
                  color: activeTab === tab ? 'var(--accent-emerald)' : 'var(--text-dim)',
                  border: activeTab === tab ? '1px solid var(--accent-emerald)' : '1px solid transparent',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab === 'all'
                  ? 'All Insights'
                  : tab === 'intuition'
                    ? '💡 Intuition'
                    : tab === 'invariant'
                      ? '📐 Invariant'
                      : '🎯 Rationale'}
              </button>
            ))}
          </div>

          {/* 1. INTUITION & MENTAL MODEL */}
          {(activeTab === 'all' || activeTab === 'intuition') && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(0, 255, 157, 0.05)',
                borderLeft: '4px solid var(--accent-emerald)',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-emerald)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>💡</span> ALGORITHM INTUITION & MENTAL MODEL
              </div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.86rem', lineHeight: '1.45' }}>
                {intuitionText || whatText || 'Analyzing current step execution and state invariants.'}
              </div>
            </div>
          )}

          {/* 2. CURRENT STATE INVARIANT */}
          {(activeTab === 'all' || activeTab === 'invariant') && invariantText && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(168, 85, 247, 0.06)',
                borderLeft: '4px solid #a855f7',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#a855f7',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>📐</span> CURRENT STATE INVARIANT
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.84rem', lineHeight: '1.45' }}>
                {invariantText}
              </div>
            </div>
          )}

          {/* 3. DECISION RATIONALE */}
          {(activeTab === 'all' || activeTab === 'rationale') && rationaleText && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(6, 182, 212, 0.06)',
                borderLeft: '4px solid #06b6d4',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#06b6d4',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>🎯</span> DECISION RATIONALE & WHY
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.84rem', lineHeight: '1.45' }}>
                {rationaleText}
              </div>
            </div>
          )}

          {/* 4. WHAT IS HAPPENING (Action summary if separate) */}
          {activeTab === 'all' && whatText && intuitionText !== '' && (
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(245, 158, 11, 0.05)',
                borderLeft: '4px solid #f59e0b',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#f59e0b',
                  marginBottom: '4px',
                }}
              >
                ⚡ STEP ACTION SUMMARY
              </div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.84rem', lineHeight: '1.4' }}>
                {whatText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TutorialCard;
