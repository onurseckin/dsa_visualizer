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
  color: string;
}

const BigOChipRow: React.FC<{ chips: BigOChip[] }> = ({ chips }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
    {chips.map((chip) => (
      <div
        key={chip.label}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: 'var(--space-1) var(--space-2)',
          background: 'var(--bg-inset)',
          border: '1px solid var(--border-subtle)',
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
            color: chip.color,
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
  const chips: BigOChip[] = [
    { label: 'Best', value: timeComplexity.best, color: 'var(--success)' },
    { label: 'Avg', value: timeComplexity.average, color: 'var(--text-primary)' },
    { label: 'Worst', value: timeComplexity.worst, color: 'var(--warning)' },
    { label: 'Space', value: spaceComplexity, color: 'var(--info)' },
  ];

  const variables = variableState ? Object.entries(variableState) : [];

  return (
    <Collapsible title="Complexity" defaultOpen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <BigOChipRow chips={chips} />
        <ProseBlock label="Time" body={complexityAnalysis.time} />
        <ProseBlock label="Space" body={complexityAnalysis.space} />
        {variables.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            {variables.map(([key, value]) => (
              <span key={key} className="ui-chip">
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
