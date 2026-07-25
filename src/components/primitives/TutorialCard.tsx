import React, { useState } from 'react';
import { StepExplanation } from '../../types/dsa';

export interface TutorialCardProps {
  explanation?: StepExplanation;
  what?: string;
  why?: string;
  stepIndex?: number;
  totalSteps?: number;
  codeLine?: number;
  initialCollapsed?: boolean;
  onClose?: () => void;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({
  explanation,
  what,
  why,
  stepIndex,
  totalSteps,
  codeLine,
  initialCollapsed = false,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const whatText = what || explanation?.what || '';
  const whyText = why || explanation?.why || '';

  return (
    <div className="glass-card" style={{ width: '100%', overflow: 'hidden' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'var(--bg-surface)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              color: 'var(--bg-darkest)',
              fontSize: '0.75rem',
              fontWeight: 800,
            }}
          >
            ?
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Step Tutorial Guide
          </span>
          {stepIndex !== undefined && (
            <span
              style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-code)',
                color: 'var(--accent-mint)',
                background: 'rgba(0, 255, 157, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid var(--border-muted)',
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
              }}
            >
              Line {codeLine}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="btn"
            style={{
              padding: '2px 8px',
              fontSize: '0.75rem',
              lineHeight: 1,
              background: 'transparent',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {isCollapsed ? 'Show ▲' : 'Collapse ▼'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
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

      {/* Card Content */}
      {!isCollapsed && (
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* WHAT Section */}
          {whatText && (
            <div
              style={{
                padding: '12px',
                background: 'rgba(0, 255, 157, 0.06)',
                borderLeft: '4px solid var(--accent-emerald)',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-emerald)',
                  marginBottom: '4px',
                }}
              >
                WHAT IS HAPPENING
              </div>
              <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.45' }}>
                {whatText}
              </div>
            </div>
          )}

          {/* WHY Section */}
          {whyText && (
            <div
              style={{
                padding: '12px',
                background: 'rgba(6, 182, 212, 0.06)',
                borderLeft: '4px solid #06b6d4',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#06b6d4',
                  marginBottom: '4px',
                }}
              >
                WHY THIS STEP
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.86rem', lineHeight: '1.45' }}>
                {whyText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TutorialCard;
