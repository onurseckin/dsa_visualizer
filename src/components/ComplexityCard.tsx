import React from 'react';
import { Collapsible } from '../ui';
import type { ComplexityAnalysis, TimeComplexity } from '../types/dsa';

export interface ComplexityCardProps {
  timeComplexity: TimeComplexity;
  spaceComplexity: string;
  complexityAnalysis: ComplexityAnalysis;
  variableState?: Record<string, string | number | boolean>;
}

interface BigOChip {
  label: string;
  value: string;
}

/* The ui.css defaults sit at --border-subtle, which disappears on the near-black
   palette; every edge inside this panel is promoted to --border-default. */
const CHIP_BORDER: React.CSSProperties = { borderColor: 'var(--border-default)' };

const BigOChipRow: React.FC<{ chips: BigOChip[] }> = ({ chips }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
    {chips.map((chip) => (
      <div
        key={chip.label}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          padding: 'var(--space-1) var(--space-2)',
          /* A metric well rather than a raised chip: the elevated tier is only
             1.68x the surface behind it, while the inset tier reads instantly. */
          background: 'var(--bg-inset)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          minWidth: '64px',
        }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{chip.label}</span>
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {chip.value}
        </span>
      </div>
    ))}
  </div>
);

const ProseBlock: React.FC<{ label: string; body: string }> = ({ label, body }) => (
  <div>
    <div
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--text-muted)',
        marginBottom: 'var(--space-1)',
      }}
    >
      {label}
    </div>
    <p
      style={{
        margin: 0,
        fontSize: 'var(--text-sm)',
        lineHeight: 1.55,
        color: 'var(--text-secondary)',
      }}
    >
      {body}
    </p>
  </div>
);

export const ComplexityCard: React.FC<ComplexityCardProps> = ({
  timeComplexity,
  spaceComplexity,
  complexityAnalysis,
  variableState,
}) => {
  /* Big-O readouts are panel content, not badges or data marks, so they stay on
     the neutral ramp (R5.1) — the label above each value carries the meaning. */
  const chips: BigOChip[] = [
    { label: 'Best', value: timeComplexity.best },
    { label: 'Avg', value: timeComplexity.average },
    { label: 'Worst', value: timeComplexity.worst },
    { label: 'Space', value: spaceComplexity },
  ];

  const variables = variableState ? Object.entries(variableState) : [];

  return (
    // No height of its own: the panel is exactly as tall as the prose it holds
    // so the workspace column can hug it (DESIGN.md R4.2).
    <Collapsible title="Complexity" defaultOpen style={{ borderColor: 'var(--border-default)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <BigOChipRow chips={chips} />
        <ProseBlock label="Time" body={complexityAnalysis.time} />
        <ProseBlock label="Space" body={complexityAnalysis.space} />
        {variables.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            {variables.map(([key, value]) => (
              <span key={key} className="ui-chip" style={CHIP_BORDER}>
                <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
                <span style={{ color: 'var(--text-primary)' }}>{String(value)}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </Collapsible>
  );
};
