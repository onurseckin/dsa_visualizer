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
  onClose?: () => void;
}

/* This lives inside the visualizer panel now (DESIGN.md R5.2), so it is a flush
   band rather than a card: the panel strip that wraps it owns the band fill and
   the single divider facing the canvas, so drawing a border, radius, shadow or
   background here would double the edge and hide that fill. No height of its own. */
const STRIP: React.CSSProperties = {
  background: 'transparent',
  // Zeroing the width (rather than the colour) drops ui.css's card edge without
  // leaving a 1px transparent ring that would shift the band's height.
  borderWidth: 0,
  borderRadius: 0,
  boxShadow: 'none',
};

/* Single source of truth for "is there anything to show" — see the matching
   helper in AuxiliaryPanel: a parent wrapping this in a bordered strip must ask
   first, or an explanation-less step renders an empty band with a divider. */
export const hasTutorialContent = (
  explanation?: StepExplanation,
  what?: string,
  why?: string,
): boolean =>
  Boolean((what || explanation?.what || '').trim() || (why || explanation?.why || '').trim());

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
    <Card padding="none" style={STRIP}>
      {/* One row: the step counter sits beside the prose instead of above it, so
          the strip is exactly as tall as the sentence it shows. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-1) var(--space-2)',
          minWidth: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            color: 'var(--text-secondary)',
            marginTop: '3px',
          }}
        >
          <GraduationCap size={14} />
        </span>

        {stepLabel && (
          <span
            style={{
              flexShrink: 0,
              marginTop: '2px',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {stepLabel}
          </span>
        )}

        <p
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
            fontSize: 'var(--text-sm)',
            lineHeight: 1.45,
            color: 'var(--text-secondary)',
          }}
        >
          {lead && <strong style={{ color: 'var(--text-primary)' }}>{lead}</strong>}
          {lead && whyText ? ' ' : ''}
          {whyText}
        </p>

        {onClose && (
          /* Bordered rather than ghost: a transparent-edged button is invisible on
             the near-black surface (DESIGN.md R5.1). */
          <IconButton icon={<X />} aria-label="Hide tutorial" size="sm" onClick={onClose} />
        )}
      </div>
    </Card>
  );
};
