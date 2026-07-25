import React from 'react';
import { TimeComplexity } from '../types/dsa';
import { Clock, Cpu } from 'lucide-react';

interface ComplexityCardProps {
  timeComplexity: TimeComplexity;
  spaceComplexity: string;
  variableState?: Record<string, string | number | boolean>;
}

export const ComplexityCard: React.FC<ComplexityCardProps> = ({
  timeComplexity,
  spaceComplexity,
  variableState,
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '0.85rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock style={{ width: '15px', height: '15px', color: 'var(--accent-emerald)' }} />
          Complexity Analysis
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.75rem' }}>
        <div style={{ background: 'var(--bg-darkest)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-muted)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Best Time</div>
          <div style={{ fontFamily: 'var(--font-code)', fontWeight: 600, color: 'var(--accent-emerald)' }}>
            {timeComplexity.best}
          </div>
        </div>

        <div style={{ background: 'var(--bg-darkest)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-muted)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Avg Time</div>
          <div style={{ fontFamily: 'var(--font-code)', fontWeight: 600, color: 'var(--accent-mint)' }}>
            {timeComplexity.average}
          </div>
        </div>

        <div style={{ background: 'var(--bg-darkest)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-muted)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Worst Time</div>
          <div style={{ fontFamily: 'var(--font-code)', fontWeight: 600, color: 'var(--state-compare)' }}>
            {timeComplexity.worst}
          </div>
        </div>

        <div style={{ background: 'var(--bg-darkest)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-muted)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Space</div>
          <div style={{ fontFamily: 'var(--font-code)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            {spaceComplexity}
          </div>
        </div>
      </div>

      {variableState && Object.keys(variableState).length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Cpu style={{ width: '13px', height: '13px', color: 'var(--accent-mint)' }} />
            Live State Registers
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {Object.entries(variableState).map(([key, value]) => (
              <span
                key={key}
                style={{
                  fontFamily: 'var(--font-code)',
                  fontSize: '0.75rem',
                  background: 'var(--bg-surface)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{key}:</span>{' '}
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{String(value)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
