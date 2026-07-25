import React from 'react';
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
  variant?: 'standalone' | 'banner' | 'floating' | 'sidebar';
}

export const TutorialCard: React.FC<TutorialCardProps> = ({
  explanation,
  what,
  why,
  stepIndex,
  totalSteps,
  codeLine,
  onClose,
}) => {
  const whatText = what || explanation?.what || '';
  const whyText = why || explanation?.why || '';

  // Combine into clean, fluid teacher prose
  const teacherText = [whatText, whyText].filter(Boolean).join(' ');

  if (!teacherText) return null;

  return (
    <div
      style={{
        padding: '0.85rem 1.1rem',
        background: 'rgba(15, 23, 42, 0.75)',
        borderLeft: '3px solid var(--accent-emerald)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'var(--font-code)',
              color: 'var(--accent-emerald)',
              background: 'rgba(0, 255, 157, 0.1)',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 157, 0.2)',
            }}
          >
            Step {stepIndex !== undefined ? stepIndex + 1 : 1}
            {totalSteps !== undefined ? ` / ${totalSteps}` : ''}
          </span>
          {codeLine !== undefined && (
            <span
              style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-code)',
                color: 'var(--text-dim)',
              }}
            >
              Line {codeLine}
            </span>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: '0 4px',
            }}
            title="Dismiss explanation"
            aria-label="Dismiss explanation"
          >
            ✕
          </button>
        )}
      </div>

      <p
        style={{
          margin: 0,
          color: 'var(--text-main)',
          fontSize: '0.88rem',
          lineHeight: 1.55,
          fontFamily: 'var(--font-ui)',
        }}
      >
        {teacherText}
      </p>
    </div>
  );
};
