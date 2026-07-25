import React from 'react';
import { GraduationCap, X } from 'lucide-react';
import { Card, IconButton } from '../../ui';
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
  onClose,
}) => {
  const whatText = (what || explanation?.what || '').trim();
  const whyText = (why || explanation?.why || '').trim();

  if (!whatText && !whyText) return null;

  // The "what" is a short action label; give it terminal punctuation so it
  // reads as the lead-in sentence of the paragraph.
  const lead = whatText && !/[.!?:]$/.test(whatText) ? `${whatText}.` : whatText;

  const stepLabel =
    stepIndex !== undefined
      ? `Step ${stepIndex + 1}${totalSteps !== undefined ? ` of ${totalSteps}` : ''}`
      : undefined;

  return (
    <Card padding="sm">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
        <span
          aria-hidden="true"
          style={{ display: 'inline-flex', color: 'var(--text-muted)', marginTop: '2px' }}
        >
          <GraduationCap size={16} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {stepLabel && (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {stepLabel}
            </div>
          )}
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              lineHeight: 1.55,
              color: 'var(--text-secondary)',
            }}
          >
            {lead && <strong style={{ color: 'var(--text-primary)' }}>{lead}</strong>}
            {lead && whyText ? ' ' : ''}
            {whyText}
          </p>
        </div>

        {onClose && (
          <IconButton
            icon={<X />}
            aria-label="Hide tutorial"
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        )}
      </div>
    </Card>
  );
};
