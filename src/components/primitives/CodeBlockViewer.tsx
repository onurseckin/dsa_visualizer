import React from 'react';
import { Code2, Terminal } from 'lucide-react';

export interface CodeBlockViewerProps {
  code: string;
  activeLine: number;
  variables?: Record<string, string | number | boolean>;
}

export const CodeBlockViewer: React.FC<CodeBlockViewerProps> = ({
  code,
  activeLine,
  variables,
}) => {
  const lines = code.trim().split('\n');

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          background: 'var(--bg-darkest)',
          borderBottom: '1px solid var(--border-muted)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code2 style={{ width: '16px', height: '16px', color: 'var(--accent-emerald)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Algorithm Code Implementation
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-code)',
            fontSize: '0.75rem',
            color: 'var(--accent-emerald)',
          }}
        >
          Executing Line: {activeLine}
        </span>
      </div>

      {/* Code Editor / Line Viewer */}
      <div
        style={{
          padding: '0.75rem 0',
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-darkest)',
        }}
      >
        {lines.map((lineText, idx) => {
          const lineNumber = idx + 1;
          const isActive = lineNumber === activeLine;

          return (
            <div
              key={idx}
              className={`code-line ${isActive ? 'code-line-active' : ''}`}
            >
              {/* Line Number */}
              <span
                style={{
                  width: '32px',
                  display: 'inline-block',
                  textAlign: 'right',
                  marginRight: '12px',
                  color: isActive ? 'var(--accent-emerald)' : 'var(--text-dark)',
                  userSelect: 'none',
                  fontSize: '0.8rem',
                }}
              >
                {lineNumber}
              </span>
              {/* Line Content */}
              <span style={{ color: isActive ? 'var(--accent-emerald)' : 'var(--text-main)' }}>
                {lineText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Variable Register Footer */}
      {variables && Object.keys(variables).length > 0 && (
        <div
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <Terminal style={{ width: '14px', height: '14px', color: 'var(--accent-mint)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vars:</span>
          {Object.entries(variables).map(([k, v]) => (
            <span
              key={k}
              style={{
                fontFamily: 'var(--font-code)',
                fontSize: '0.75rem',
                color: 'var(--text-main)',
                background: 'var(--bg-darkest)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {k}=<span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{String(v)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
