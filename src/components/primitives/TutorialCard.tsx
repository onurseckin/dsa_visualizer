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

/* This is the visualizer panel's header now (DESIGN.md R6.4), so it is a flush
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

/* This is the one thing the learner reads on every single step, so it is sized as
   prose and not as a caption: --text-md at 1.6, which is the same measure the
   lesson body in ProblemHeader uses. --text-xs and --text-sm are deliberately
   absent from this component. */
const PROSE: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-md)',
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
  /* Two lines are reserved so the canvas boundary stops jumping every time a
     step's sentence is one line longer than the last one's. Beyond three lines
     the wrapping strip scrolls; nothing here truncates. */
  minHeight: 'calc(var(--text-md) * 1.6 * 2)',
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          padding: 'var(--space-3)',
          minWidth: 0,
        }}
      >
        {/* The counter and the dismiss control sit on their own row so the prose
            below them gets the panel's full measure instead of a leftover column. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{ display: 'inline-flex', flexShrink: 0, color: 'var(--text-secondary)' }}
          >
            <GraduationCap size={16} />
          </span>

          {stepLabel && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 'var(--text-md)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {stepLabel}
            </span>
          )}

          <div style={{ flex: 1, minWidth: 0 }} />

          {onClose && (
            /* Bordered rather than ghost: a transparent-edged button is invisible on
               the near-black surface (DESIGN.md R6.2). */
            <IconButton icon={<X />} aria-label="Hide tutorial" size="sm" onClick={onClose} />
          )}
        </div>

        <p style={PROSE}>
          {lead && <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{lead}</strong>}
          {lead && whyText ? ' ' : ''}
          {whyText}
        </p>
      </div>
    </Card>
  );
};
